'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setConnected(false)
      }
      return
    }

    const s = io(window.location.origin, { path: '/socket.io' })

    s.on('connect', () => {
      setConnected(true)
      s.emit('join', user._id)
    })

    s.on('disconnect', () => {
      setConnected(false)
    })

    setSocket(s)

    return () => {
      s.emit('leave', user._id)
      s.disconnect()
    }
  }, [user?._id])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
