export interface User {
  id: string
  email: string
  name: string
}

export interface Auction {
  id: string
  seller_id: string
  title: string
  description: string
  starting_price: number
  bid_increment: number
  current_highest_bid: number | null
  highest_bidder_id: string | null
  start_time: string
  duration_hours: number
  end_time: string
  status: 'pending' | 'active' | 'ended'
  seller_accepted: boolean | null
  created_at: string
  seller?: User
  highest_bidder?: User
}

export interface Bid {
  id: string
  auction_id: string
  bidder_id: string
  amount: number
  created_at: string
  bidder?: User
}

export interface Notification {
  id: string
  user_id: string
  auction_id: string
  type: 'new_bid' | 'outbid' | 'auction_won' | 'auction_ended' | 'bid_accepted' | 'bid_rejected'
  message: string
  read: boolean
  created_at: string
}
