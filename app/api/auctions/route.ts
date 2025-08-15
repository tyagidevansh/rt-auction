import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    // First, update auction statuses based on current time
    const nowUTC = new Date().toISOString()
    
    // Update pending auctions to active if start time has passed
    await supabase
      .from('auctions')
      .update({ status: 'active' })
      .eq('status', 'pending')
      .lte('start_time', nowUTC)
    
    // Update active auctions to ended if end time has passed
    await supabase
      .from('auctions')
      .update({ status: 'ended' })
      .eq('status', 'active')
      .lte('end_time', nowUTC)

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
      return NextResponse.json(
        { error: 'Failed to fetch auctions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ auctions: data })
  } catch (error) {
    console.error('Error fetching auctions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      seller_id,
      title,
      description,
      starting_price,
      bid_increment,
      start_time,
      duration_hours
    } = body

    if (!seller_id || !title || !starting_price || !bid_increment || !start_time || !duration_hours) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Failed to create auction' },
        { status: 500 }
      )
    }

    return NextResponse.json({ auction: data })
  } catch (error) {
    console.error('Error creating auction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
