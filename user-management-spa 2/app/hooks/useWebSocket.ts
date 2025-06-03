"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

interface Message {
  id: number
  roomId: number
  senderId: number
  senderUsername: string
  content: string
  messageType: string
  sentAt: string
  editedAt?: string
}

interface ChatRoom {
  id: number
  name: string
  type: string
  display_name: string
  participant_count: number
  last_message?: string
  last_message_time?: string
}

interface TypingUser {
  userId: number
  username: string
  isTyping: boolean
}

export function useWebSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<{ [roomId: number]: Message[] }>({})
  const [typingUsers, setTypingUsers] = useState<{ [roomId: number]: TypingUser[] }>({})
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return

    const newSocket = io("http://localhost:8000", {
      auth: { token },
    })

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket")
      setConnected(true)
      setError(null)
    })

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket")
      setConnected(false)
    })

    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err.message)
      setError("Failed to connect to chat server")
      setConnected(false)
    })

    newSocket.on("new_message", (message: Message) => {
      setMessages((prev) => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] || []), message],
      }))
    })

    newSocket.on("chat_history", (data: { roomId: number; messages: Message[] }) => {
      setMessages((prev) => ({
        ...prev,
        [data.roomId]: data.messages,
      }))
    })

    newSocket.on("user_typing", (data: TypingUser & { roomId?: number }) => {
      if (!data.roomId) return

      setTypingUsers((prev) => {
        const roomTyping = prev[data.roomId!] || []
        const existingIndex = roomTyping.findIndex((user) => user.userId === data.userId)

        if (data.isTyping) {
          if (existingIndex === -1) {
            return {
              ...prev,
              [data.roomId!]: [...roomTyping, data],
            }
          }
        } else {
          if (existingIndex !== -1) {
            const newRoomTyping = roomTyping.filter((user) => user.userId !== data.userId)
            return {
              ...prev,
              [data.roomId!]: newRoomTyping,
            }
          }
        }

        return prev
      })
    })

    newSocket.on("error", (errorMessage: string) => {
      setError(errorMessage)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [token])

  const sendMessage = (roomId: number, content: string, messageType = "text") => {
    if (socket && connected) {
      socket.emit("send_message", { roomId, content, messageType })
    }
  }

  const joinRoom = (roomId: number) => {
    if (socket && connected) {
      socket.emit("join_room", roomId)
    }
  }

  const getChatHistory = (roomId: number) => {
    if (socket && connected) {
      socket.emit("get_chat_history", roomId)
    }
  }

  const createPrivateChat = (targetUserId: number) => {
    if (socket && connected) {
      socket.emit("create_private_chat", targetUserId)
    }
  }

  const setTyping = (roomId: number, isTyping: boolean) => {
    if (socket && connected) {
      socket.emit("typing", { roomId, isTyping })
    }
  }

  return {
    socket,
    connected,
    messages,
    typingUsers,
    error,
    sendMessage,
    joinRoom,
    getChatHistory,
    createPrivateChat,
    setTyping,
  }
}
