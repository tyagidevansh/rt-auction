import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

// Use relative URL when deployed, localhost for development
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const currentRoomRef = useRef<string | null>(null)

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      socket.emit('test', 'Hello from client')
    })

    socket.on('test_response', (message) => {
      console.log('Received test response:', message)
    })

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  const joinAuction = useCallback((auctionId: string) => {
    if (socketRef.current && currentRoomRef.current !== auctionId) {
      // leave current room if different
      if (currentRoomRef.current) {
        socketRef.current.emit('leave_auction', currentRoomRef.current)
      }
      // join new room
      socketRef.current.emit('join_auction', auctionId)
      currentRoomRef.current = auctionId
    }
  }, [])

  const leaveAuction = useCallback((auctionId: string) => {
    if (socketRef.current && currentRoomRef.current === auctionId) {
      socketRef.current.emit('leave_auction', auctionId)
      currentRoomRef.current = null
    }
  }, [])

  const onAuctionUpdate = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      console.log('Setting up auction_updated listener')
      socketRef.current.on('auction_updated', (data) => {
        console.log('auction_updated event received:', data)
        callback(data)
      })
    }
  }, [])

  const offAuctionUpdate = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      console.log('Removing auction_updated listener')
      socketRef.current.removeAllListeners('auction_updated')
    }
  }, [])

  return {
    socket: socketRef.current,
    joinAuction,
    leaveAuction,
    onAuctionUpdate,
    offAuctionUpdate,
  }
}
