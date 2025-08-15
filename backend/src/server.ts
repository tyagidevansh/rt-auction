import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'

import authRoutes from './routes/auth'
import auctionsRoutes from './routes/auctions'
import bidsRoutes from './routes/bids'
import notificationsRoutes from './routes/notifications'

dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(morgan('combined'))

// CORS configuration - more permissive for development
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 
}

app.use(cors(corsOptions))

// initialize Socket.IO with CORS
const io = new Server(server, {
  cors: corsOptions
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Test event
  socket.on('test', (message) => {
    console.log('Received test message:', message)
    socket.emit('test_response', 'Hello from server')
  })

  // Join auction room
  socket.on('join_auction', (auctionId: string) => {
    socket.join(`auction_${auctionId}`)
    const room = io.sockets.adapter.rooms.get(`auction_${auctionId}`)
    console.log(`Socket joined auction ${auctionId}, room size: ${room?.size || 0}`)
  })

  // Leave auction room
  socket.on('leave_auction', (auctionId: string) => {
    socket.leave(`auction_${auctionId}`)
    const room = io.sockets.adapter.rooms.get(`auction_${auctionId}`)
    console.log(`Socket left auction ${auctionId}, room size: ${room?.size || 0}`)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Make io accessible in routes
app.set('io', io)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/auctions', auctionsRoutes)
app.use('/api/auctions', bidsRoutes) // This handles /api/auctions/:id/bids
app.use('/api/notifications', notificationsRoutes)

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
//   console.log(`API available at http://localhost:${PORT}`)
//   console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
export { io }
