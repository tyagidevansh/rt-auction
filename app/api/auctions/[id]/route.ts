import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // First, update auction status based on current time
    const nowUTC = new Date().toISOString()
    
    // Update pending to active if start time has passed
    await supabase
      .from('auctions')
      .update({ status: 'active' })
      .eq('id', id)
      .eq('status', 'pending')
      .lte('start_time', nowUTC)
    
    // Update active to ended if end time has passed
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
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ auction: data })
  } catch (error) {
    console.error('Error fetching auction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { seller_accepted } = body

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
      return NextResponse.json(
        { error: 'Failed to update auction' },
        { status: 500 }
      )
    }

    // Create notification for the highest bidder
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

    return NextResponse.json({ auction: data })
  } catch (error) {
    console.error('Error updating auction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
