import { Request, Response, Router } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

// GET /api/auctions/:id/bids
router.get('/:id/bids', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        bidder:users!bidder_id(id, name, email)
      `)
      .eq('auction_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bids:', error)
      return res.status(500).json({
        error: 'Failed to fetch bids'
      })
    }

    res.json({ bids: data })
  } catch (error) {
    console.error('Error fetching bids:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

// POST /api/auctions/:id/bids
router.post('/:id/bids', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { bidder_id, amount } = req.body

    if (!bidder_id || !amount) {
      return res.status(400).json({
        error: 'Bidder ID and amount are required'
      })
    }

    // Get current auction data
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', id)
      .single()

    if (auctionError || !auction) {
      return res.status(404).json({
        error: 'Auction not found'
      })
    }

    // Update auction status based on current time
    const nowUTC = new Date().toISOString()
    let currentAuction = auction
    
    if (auction.status === 'pending' && auction.start_time <= nowUTC) {
      // Update to active if start time has passed
      const { data: updatedAuction } = await supabase
        .from('auctions')
        .update({ status: 'active' })
        .eq('id', id)
        .select('*')
        .single()
      currentAuction = updatedAuction || auction
    } else if (auction.status === 'active' && auction.end_time <= nowUTC) {
      // Update to ended if end time has passed
      await supabase
        .from('auctions')
        .update({ status: 'ended' })
        .eq('id', id)
      currentAuction = { ...auction, status: 'ended' }
    }

    // Check if auction is active
    if (currentAuction.status !== 'active') {
      return res.status(400).json({
        error: 'Auction is not active'
      })
    }

    // Check if bid is high enough
    const minimumBid = currentAuction.current_highest_bid 
      ? currentAuction.current_highest_bid + currentAuction.bid_increment
      : currentAuction.starting_price

    if (amount < minimumBid) {
      return res.status(400).json({
        error: `Bid must be at least $${minimumBid}`
      })
    }

    // Check if bidder is not the seller
    if (bidder_id === currentAuction.seller_id) {
      return res.status(400).json({
        error: 'Sellers cannot bid on their own auctions'
      })
    }

    // Create the bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert([{
        auction_id: id,
        bidder_id,
        amount
      }])
      .select(`
        *,
        bidder:users!bidder_id(id, name, email)
      `)
      .single()

    if (bidError) {
      console.error('Error creating bid:', bidError)
      return res.status(500).json({
        error: 'Failed to place bid'
      })
    }

    // Update auction with new highest bid
    const { error: updateError } = await supabase
      .from('auctions')
      .update({
        current_highest_bid: amount,
        highest_bidder_id: bidder_id
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating auction:', updateError)
      return res.status(500).json({
        error: 'Failed to update auction'
      })
    }

    // Create notifications
    // Notify the seller
    await supabase
      .from('notifications')
      .insert([{
        user_id: auction.seller_id,
        auction_id: id,
        type: 'new_bid',
        message: `New bid of $${amount} placed on "${auction.title}"`
      }])

    // Notify previous highest bidder (if exists and different from current bidder)
    if (auction.highest_bidder_id && auction.highest_bidder_id !== bidder_id) {
      await supabase
        .from('notifications')
        .insert([{
          user_id: auction.highest_bidder_id,
          auction_id: id,
          type: 'outbid',
          message: `You have been outbid on "${auction.title}". New highest bid: $${amount}`
        }])
    }

    res.json({ bid })
  } catch (error) {
    console.error('Error placing bid:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

export default router
