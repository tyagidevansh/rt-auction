import { Request, Response, Router } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string || 'active'

    // first, update auction statuses based on current time
    const nowUTC = new Date().toISOString()
    
    // update pending auctions to active if start time has passed
    await supabase
      .from('auctions')
      .update({ status: 'active' })
      .eq('status', 'pending')
      .lte('start_time', nowUTC)
    
    // update active auctions to ended if end time has passed
    await supabase
      .from('auctions')
      .update({ status: 'ended' })
      .eq('status', 'active')
      .lte('end_time', nowUTC)

    // fetch list of auctions, each with seller and highest bidder details included
    let query = supabase
      .from('auctions')
      .select(`
        *,
        seller:users!seller_id(id, name, email),
        highest_bidder:users!highest_bidder_id(id, name, email)
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching auctions:', error)
      return res.status(500).json({
        error: 'Failed to fetch auctions'
      })
    }

    res.json({ auctions: data })
  } catch (error) {
    console.error('Error fetching auctions:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      seller_id,
      title,
      description,
      starting_price,
      bid_increment,
      start_time,
      duration_hours
    } = req.body

    if (!seller_id || !title || !starting_price || !bid_increment || !start_time || !duration_hours) {
      return res.status(400).json({
        error: 'Missing required fields'
      })
    }

    // start_time is already in UTC format from the frontend
    const startTimeUTC = start_time
    const nowUTC = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('auctions')
      .insert([{
        seller_id,
        title,
        description,
        starting_price,
        bid_increment,
        start_time: startTimeUTC,
        duration_hours,
        status: startTimeUTC <= nowUTC ? 'active' : 'pending'
      }])
      .select(`
        *,
        seller:users!seller_id(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Error creating auction:', error)
      return res.status(500).json({
        error: 'Failed to create auction'
      })
    }

    res.json({ auction: data })
  } catch (error) {
    console.error('Error creating auction:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

// get specific auction
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // first, update auction status based on current time
    const nowUTC = new Date().toISOString()
    
    // update pending to active if start time has passed
    await supabase
      .from('auctions')
      .update({ status: 'active' })
      .eq('id', id)
      .eq('status', 'pending')
      .lte('start_time', nowUTC)
    
    // update active to ended if end time has passed
    await supabase
      .from('auctions')
      .update({ status: 'ended' })
      .eq('id', id)
      .eq('status', 'active')
      .lte('end_time', nowUTC)
    
    const { data, error } = await supabase
      .from('auctions')
      .select(`
        *,
        seller:users!seller_id(id, name, email),
        highest_bidder:users!highest_bidder_id(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching auction:', error)
      return res.status(404).json({
        error: 'Auction not found'
      })
    }

    res.json({ auction: data })
  } catch (error) {
    console.error('Error fetching auction:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

// patch /api/auctions/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { seller_accepted } = req.body

    const { data, error } = await supabase
      .from('auctions')
      .update({ seller_accepted })
      .eq('id', id)
      .select(`
        *,
        seller:users!seller_id(id, name, email),
        highest_bidder:users!highest_bidder_id(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Error updating auction:', error)
      return res.status(500).json({
        error: 'Failed to update auction'
      })
    }

    // create notification for the highest bidder
    if (data.highest_bidder_id) {
      const notificationMessage = seller_accepted 
        ? `Your bid of $${data.current_highest_bid} for "${data.title}" has been accepted!`
        : `Your bid of $${data.current_highest_bid} for "${data.title}" has been rejected.`
      
      await supabase
        .from('notifications')
        .insert([{
          user_id: data.highest_bidder_id,
          auction_id: data.id,
          type: seller_accepted ? 'bid_accepted' : 'bid_rejected',
          message: notificationMessage
        }])
    }

    const io = req.app.get('io')
    if (io) {
      // emit to all clients in the auction room
      io.to(`auction_${id}`).emit('auction_updated', {
        auction: data,
        statusChanged: true
      })
    }

    res.json({ auction: data })
  } catch (error) {
    console.error('Error updating auction:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

export default router
