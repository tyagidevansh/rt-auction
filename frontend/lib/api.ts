const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Auctions
  AUCTIONS: `${API_BASE_URL}/api/auctions`,
  AUCTION: (id: string) => `${API_BASE_URL}/api/auctions/${id}`,
  
  // Bids
  AUCTION_BIDS: (id: string) => `${API_BASE_URL}/api/auctions/${id}/bids`,
  
  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
}

export default API_BASE_URL
