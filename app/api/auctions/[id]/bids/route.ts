import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      return NextResponse.json(
        { error: 'Failed to fetch bids' },
        { status: 500 }
      )
    }

    return NextResponse.json({ bids: data })
  } catch (error) {
    console.error('Error fetching bids:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { bidder_id, amount } = body

    if (!bidder_id || !amount) {
      return NextResponse.json(
        { error: 'Bidder ID and amount are required' },
        { status: 400 }
      )
    }

    // Get current auction data
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', id)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
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
      return NextResponse.json(
        { error: 'Auction is not active' },
        { status: 400 }
      )
    }

    // Check if bid is high enough
    const minimumBid = currentAuction.current_highest_bid 
      ? currentAuction.current_highest_bid + currentAuction.bid_increment
      : currentAuction.starting_price

    if (amount < minimumBid) {
      return NextResponse.json(
        { error: `Bid must be at least $${minimumBid}` },
        { status: 400 }
      )
    }

    // Check if bidder is not the seller
    if (bidder_id === currentAuction.seller_id) {
      return NextResponse.json(
        { error: 'Sellers cannot bid on their own auctions' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Failed to place bid' },
        { status: 500 }
      )
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
      return NextResponse.json(
        { error: 'Failed to update auction' },
        { status: 500 }
      )
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

    return NextResponse.json({ bid })
  } catch (error) {
    console.error('Error placing bid:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
