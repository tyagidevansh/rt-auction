// Use relative URLs so requests go through the same port the user is accessing
const API_BASE_URL = ''

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
