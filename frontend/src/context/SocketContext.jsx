import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL?.trim().replace(/\/+$/, '') ||
      import.meta.env.VITE_API_URL?.trim().replace(/\/api\/?$/, '') ||
      window.location.origin

    const newSocket = io(socketUrl, {
      withCredentials: true,
    })
    setSocket(newSocket)

    return () => newSocket.close()
  }, [])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
