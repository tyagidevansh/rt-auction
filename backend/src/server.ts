import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { createProxyMiddleware } from 'http-proxy-middleware'

import authRoutes from './routes/auth'
import auctionsRoutes from './routes/auctions'
import bidsRoutes from './routes/bids'
import notificationsRoutes from './routes/notifications'
import emailRoutes from './routes/email'

dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001

// Trust proxy for Render.com
app.set('trust proxy', 1)

// Configure helmet to be less restrictive for Next.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))
app.use(morgan('combined'))

// CORS configuration - more permissive for development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.RENDER_EXTERNAL_URL, process.env.FRONTEND_URL].filter((url): url is string => Boolean(url))
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
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

app.set('io', io)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/auctions', auctionsRoutes)
app.use('/api/auctions', bidsRoutes) // This handles /api/auctions/:id/bids
app.use('/api/notifications', notificationsRoutes)
app.use('/api/email', emailRoutes)

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Proxy all non-API routes to Next.js server (port 3000)
app.use('*', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  timeout: 30000, // 30 second timeout
  proxyTimeout: 30000,
  router: (req: any) => {
    // Only proxy non-API requests
    if (req.originalUrl?.startsWith('/api/')) {
      return undefined; // Don't proxy API requests
    }
    return 'http://localhost:3000';
  },
  onError: (err: any, req: any, res: any) => {
    console.error('Proxy error:', err.message);
    console.error('Request URL:', req?.originalUrl);
    if (res && typeof res.status === 'function') {
      // Send a simple HTML page instead of JSON for browser requests
      res.status(503).send(`
        <html>
          <head><title>Service Starting</title></head>
          <body>
            <h1>Frontend service is starting...</h1>
            <p>Please wait a moment and refresh the page.</p>
            <script>setTimeout(() => location.reload(), 2000);</script>
          </body>
        </html>
      `);
    }
  }
}))

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
