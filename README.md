# Real-Time Auction Platform

A mini real-time auction platform built with Next.js and Supabase for real-time bidding and notifications.

## Features

- **User Authentication**: Local registration and login with password hashing
- **Create & View Auctions**: Sellers can create auctions with custom start times and durations
- **Real-Time Bidding**: Instant bid placement with automatic updates
- **Live Highest Bid Display**: Current highest bid visible to all participants
- **Real-Time Notifications**: In-app notifications for new bids, outbid alerts, and auction results
- **Post-Auction Management**: Sellers can accept or reject final bids
- **Bid Status Updates**: Buyers are notified of bid acceptance/rejection

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL script from `supabase-schema.sql` to create all necessary tables and policies
4. Get your project URL and API keys from Settings > API

### 2. Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## User Guide

### Getting Started

1. **Register/Login**: Create an account or log in to start using the platform
2. **Browse Auctions**: View all active auctions on the homepage
3. **Create Auctions**: Click "Create Auction" to list items for bidding
4. **Place Bids**: Enter auction details and place bids in real-time
5. **Notifications**: Check your notifications for bid updates and auction results

### For Sellers

1. Create auctions with detailed descriptions and pricing
2. Set start times (can be immediate or scheduled for later)
3. Choose auction duration (1 hour to 1 week)
4. Monitor bids in real-time
5. Accept or reject final bids when auctions end

### For Buyers

1. Browse available auctions
2. Place bids that meet minimum requirements
3. Receive notifications when outbid
4. Get notified of bid acceptance/rejection

## Technical Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Custom JWT-less auth with bcrypt password hashing
- **Real-time Updates**: Polling-based updates every 3-5 seconds
- **Styling**: Minimal black and white design using Tailwind CSS

## API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auctions` - List auctions (with status filter)
- `POST /api/auctions` - Create new auction
- `GET /api/auctions/[id]` - Get auction details
- `PATCH /api/auctions/[id]` - Update auction (accept/reject bids)
- `GET /api/auctions/[id]/bids` - Get auction bids
- `POST /api/auctions/[id]/bids` - Place new bid
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications` - Mark notifications as read

## Database Schema

The platform uses 4 main tables:

- **users**: User accounts with authentication
- **auctions**: Auction listings with timing and pricing
- **bids**: Individual bid records
- **notifications**: Real-time notification system

All tables include Row Level Security policies for data protection.

## MVP Limitations

This is a minimal viable product (MVP) designed for demonstration purposes:

- Simple polling-based real-time updates (not WebSocket)
- Basic black and white UI design
- Local authentication (no OAuth integration)
- No image upload functionality
- No payment processing
- Basic notification system (in-app only)

## Future Enhancements

- WebSocket integration for true real-time updates
- Image upload for auction items
- Email notifications
- Payment integration
- Advanced search and filtering
- Auction categories
- User ratings and reviews
