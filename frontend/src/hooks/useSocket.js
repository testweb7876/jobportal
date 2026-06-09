import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useDispatch, useSelector } from 'react-redux'
import { addNotification } from '../store'
import { selectToken } from '../store'
import toast from 'react-hot-toast'

let socket = null

export const useSocket = () => {
  const token = useSelector(selectToken)
  const dispatch = useDispatch()
  const listenersRef = useRef({})

  useEffect(() => {
    if (!token) return

    if (!socket || !socket.connected) {
      socket = io(import.meta.env.VITE_SOCKET_URL || '', {
        auth: { token },
        transports: ['websocket', 'polling'],
      })

      socket.on('connect', () => console.log('🔌 Socket connected'))
      socket.on('disconnect', () => console.log('❌ Socket disconnected'))

      socket.on('notification', (notif) => {
        dispatch(addNotification(notif))
        toast(notif.title, { icon: '🔔', duration: 4000 })
      })
    }

    return () => {
      // Keep socket alive across component unmounts
    }
  }, [token, dispatch])

  const joinConversation = useCallback((convId) => {
    socket?.emit('join_conversation', { conversationId: convId })
  }, [])

  const leaveConversation = useCallback((convId) => {
    socket?.emit('leave_conversation', { conversationId: convId })
  }, [])

  const sendTyping = useCallback((convId, isTyping) => {
    socket?.emit(isTyping ? 'typing_start' : 'typing_stop', { conversationId: convId })
  }, [])

  const on = useCallback((event, handler) => {
    socket?.on(event, handler)
    return () => socket?.off(event, handler)
  }, [])

  const off = useCallback((event, handler) => {
    socket?.off(event, handler)
  }, [])

  return { socket, joinConversation, leaveConversation, sendTyping, on, off }
}

export const getSocket = () => socket
