"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Send, Plus, Users, User } from "lucide-react"
import { useWebSocket } from "@/hooks/useWebSocket"

interface ChatRoom {
  id: number
  name: string
  type: string
  display_name: string
  participant_count: number
  last_message?: string
  last_message_time?: string
}

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

interface ChatUser {
  id: number
  username: string
  email: string
  role: string
}

interface ChatProps {
  currentUser: {
    id: number
    username: string
    role: string
  }
}

export default function Chat({ currentUser }: ChatProps) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false)
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([])
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomType, setNewRoomType] = useState<"group" | "private">("group")
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const token = localStorage.getItem("token")
  const {
    socket,
    connected,
    messages,
    typingUsers,
    sendMessage,
    joinRoom,
    getChatHistory,
    createPrivateChat,
    setTyping,
  } = useWebSocket(token)

  useEffect(() => {
    fetchChatRooms()
    fetchAvailableUsers()
  }, [])

  useEffect(() => {
    if (selectedRoom && connected) {
      joinRoom(selectedRoom.id)
      getChatHistory(selectedRoom.id)
    }
  }, [selectedRoom, connected])

  useEffect(() => {
    scrollToBottom()
  }, [messages, selectedRoom])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchChatRooms = async () => {
    try {
      const response = await fetch("/api/chat/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setChatRooms(data)
        if (data.length > 0 && !selectedRoom) {
          setSelectedRoom(data[0])
        }
      }
    } catch (err) {
      setError("Failed to fetch chat rooms")
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch("/api/chat/users", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(data)
      }
    } catch (err) {
      setError("Failed to fetch users")
    }
  }

  const handleSendMessage = () => {
    if (!selectedRoom || !messageInput.trim() || !connected) return

    sendMessage(selectedRoom.id, messageInput.trim())
    setMessageInput("")
  }

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRoomName,
          type: newRoomType,
          participantIds: selectedUsers,
        }),
      })

      if (response.ok) {
        setIsCreateRoomOpen(false)
        setNewRoomName("")
        setSelectedUsers([])
        fetchChatRooms()
      } else {
        setError("Failed to create room")
      }
    } catch (err) {
      setError("Failed to create room")
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePrivateChat = (userId: number) => {
    if (connected) {
      createPrivateChat(userId)
      setIsPrivateChatOpen(false)
      setTimeout(fetchChatRooms, 1000) // Refresh rooms after creating private chat
    }
  }

  const handleTyping = (value: string) => {
    setMessageInput(value)

    if (!selectedRoom) return

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Send typing indicator
    setTyping(selectedRoom.id, true)

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(selectedRoom.id, false)
    }, 2000)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Сьогодні"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Вчора"
    } else {
      return new Intl.DateTimeFormat("uk-UA", {
        day: "2-digit",
        month: "2-digit",
      }).format(date)
    }
  }

  const roomMessages = selectedRoom ? messages[selectedRoom.id] || [] : []
  const roomTypingUsers = selectedRoom ? typingUsers[selectedRoom.id] || [] : []

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Chat Rooms Sidebar */}
      <div className="w-1/3 border-r bg-gray-50">
        <div className="p-4 border-b bg-white">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Чати</h3>
            <div className="flex space-x-1">
              <Button size="sm" variant="outline" onClick={() => setIsCreateRoomOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsPrivateChatOpen(true)}>
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-gray-600">{connected ? "Підключено" : "Відключено"}</span>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="p-2">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                  selectedRoom?.id === room.id ? "bg-blue-100 border-blue-200" : "bg-white hover:bg-gray-100"
                }`}
                onClick={() => setSelectedRoom(room)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {room.type === "private" ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                      <span className="font-medium text-sm">{room.display_name}</span>
                    </div>
                    {room.type === "group" && (
                      <Badge variant="secondary" className="text-xs">
                        {room.participant_count}
                      </Badge>
                    )}
                  </div>
                  {room.last_message_time && (
                    <span className="text-xs text-gray-500">{formatTime(room.last_message_time)}</span>
                  )}
                </div>
                {room.last_message && <p className="text-xs text-gray-600 truncate">{room.last_message}</p>}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center space-x-2">
                {selectedRoom.type === "private" ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                <h3 className="font-semibold">{selectedRoom.display_name}</h3>
                {selectedRoom.type === "group" && (
                  <Badge variant="outline">{selectedRoom.participant_count} учасників</Badge>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {roomMessages.map((message, index) => {
                  const showDate =
                    index === 0 || formatDate(message.sentAt) !== formatDate(roomMessages[index - 1].sentAt)

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center text-xs text-gray-500 my-2">{formatDate(message.sentAt)}</div>
                      )}
                      <div className={`flex ${message.senderId === currentUser.id ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] ${
                            message.senderId === currentUser.id ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
                          } rounded-lg p-3`}
                        >
                          {message.senderId !== currentUser.id && (
                            <div className="text-xs font-medium mb-1 opacity-70">{message.senderUsername}</div>
                          )}
                          <div className="text-sm">{message.content}</div>
                          <div
                            className={`text-xs mt-1 ${
                              message.senderId === currentUser.id ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {formatTime(message.sentAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Typing indicators */}
                {roomTypingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 rounded-lg p-3 max-w-[70%]">
                      <div className="text-xs text-gray-600">
                        {roomTypingUsers.map((user) => user.username).join(", ")} друкує...
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <Textarea
                  value={messageInput}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Введіть повідомлення..."
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                  disabled={!connected}
                />
                <Button onClick={handleSendMessage} disabled={!connected || !messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Оберіть чат для початку спілкування</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Dialog */}
      <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Створити новий чат</DialogTitle>
            <DialogDescription>Створіть груповий чат для спілкування з кількома користувачами</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Назва чату</label>
              <Input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Введіть назву чату"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Учасники</label>
              <Select
                value=""
                onValueChange={(value) => {
                  const userId = Number.parseInt(value)
                  if (!selectedUsers.includes(userId)) {
                    setSelectedUsers([...selectedUsers, userId])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Додати учасників" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers
                    .filter((user) => !selectedUsers.includes(user.id))
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedUsers.map((userId) => {
                  const user = availableUsers.find((u) => u.id === userId)
                  return (
                    <Badge key={userId} variant="secondary" className="cursor-pointer">
                      {user?.username}
                      <button
                        onClick={() => setSelectedUsers(selectedUsers.filter((id) => id !== userId))}
                        className="ml-1 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateRoom} disabled={loading || !newRoomName.trim()}>
              {loading ? "Створення..." : "Створити чат"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Private Chat Dialog */}
      <Dialog open={isPrivateChatOpen} onOpenChange={setIsPrivateChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Приватний чат</DialogTitle>
            <DialogDescription>Оберіть користувача для приватного спілкування</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleCreatePrivateChat(user.id)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
