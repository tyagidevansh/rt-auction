-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create auctions table
CREATE TABLE auctions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    starting_price DECIMAL(10,2) NOT NULL,
    bid_increment DECIMAL(10,2) NOT NULL,
    current_highest_bid DECIMAL(10,2) DEFAULT NULL,
    highest_bidder_id UUID REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    duration_hours INTEGER NOT NULL,
    end_time TIMESTAMP GENERATED ALWAYS AS (start_time + INTERVAL '1 hour' * duration_hours) STORED,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
    seller_accepted BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create bids table
CREATE TABLE bids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL CHECK (type IN ('new_bid', 'outbid', 'auction_won', 'auction_ended', 'bid_accepted', 'bid_rejected')),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_auctions_seller ON auctions(seller_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);
CREATE INDEX idx_bids_auction ON bids(auction_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (allow reading for auction participants)
CREATE POLICY "Users can view profiles of auction participants" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (true);

-- RLS Policies for auctions (public read, authenticated users can create)
CREATE POLICY "Anyone can view auctions" ON auctions FOR SELECT USING (true);
CREATE POLICY "Users can create auctions" ON auctions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update auctions" ON auctions FOR UPDATE USING (true);

-- RLS Policies for bids (public read, anyone can create)
CREATE POLICY "Anyone can view bids" ON bids FOR SELECT USING (true);
CREATE POLICY "Anyone can create bids" ON bids FOR INSERT WITH CHECK (true);

-- RLS Policies for notifications (public access for now)
CREATE POLICY "Anyone can view notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update notifications" ON notifications FOR UPDATE USING (true);
