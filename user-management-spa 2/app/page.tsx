"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit, Plus, LogOut, Users, Ticket, Calendar, MessageCircle } from "lucide-react"
import Chat from "@/components/Chat"

interface User {
  id: number
  username: string
  email: string
  role: "admin" | "user"
  created_at: string
}

interface AuthUser {
  id: number
  username: string
  role: "admin" | "user"
}

interface Event {
  id: number
  name: string
  description: string
  event_date: string
  location: string
  total_tickets: number
  available_tickets: number
  price: number
}

interface Booking {
  id: number
  event_id: number
  name: string
  description: string
  event_date: string
  location: string
  price: number
  tickets_count: number
  booking_date: string
  status: "active" | "cancelled"
}

export default function UserManagementApp() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("users")

  // Login form state
  const [loginData, setLoginData] = useState({ username: "", password: "" })

  // User form state
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user",
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    eventId: "",
    ticketsCount: 1,
  })
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      validateToken(token)
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchUsers()
      fetchEvents()
      fetchBookings()
    }
  }, [currentUser])

  const validateToken = async (token: string) => {
    try {
      const response = await fetch("/api/auth/validate", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const user = await response.json()
        setCurrentUser(user)
      } else {
        localStorage.removeItem("token")
      }
    } catch (err) {
      localStorage.removeItem("token")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        setCurrentUser(data.user)
        setLoginData({ username: "", password: "" })
        setSuccess("Login successful!")
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setCurrentUser(null)
    setUsers([])
    setSuccess("Logged out successfully")
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        setError("Failed to fetch users")
      }
    } catch (err) {
      setError("Network error occurred")
    }
  }

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        setError("Failed to fetch events")
      }
    } catch (err) {
      setError("Network error occurred")
    }
  }

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      } else {
        setError("Failed to fetch bookings")
      }
    } catch (err) {
      setError("Network error occurred")
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userForm),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("User created successfully!")
        setUserForm({ username: "", email: "", password: "", role: "user" })
        setIsUserDialogOpen(false)
        fetchUsers()
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const updateData = { ...userForm }
      if (!updateData.password) {
        delete updateData.password
      }

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("User updated successfully!")
        setUserForm({ username: "", email: "", password: "", role: "user" })
        setEditingUser(null)
        setIsUserDialogOpen(false)
        fetchUsers()
      } else {
        setError(data.error || "Failed to update user")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setSuccess("User deleted successfully!")
        fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete user")
      }
    } catch (err) {
      setError("Network error occurred")
    }
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: Number.parseInt(bookingForm.eventId),
          ticketsCount: bookingForm.ticketsCount,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Booking created successfully!")
        setBookingForm({ eventId: "", ticketsCount: 1 })
        setIsBookingDialogOpen(false)
        fetchEvents()
        fetchBookings()
      } else {
        setError(data.error || "Failed to create booking")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setSuccess("Booking cancelled successfully!")
        fetchEvents()
        fetchBookings()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to cancel booking")
      }
    } catch (err) {
      setError("Network error occurred")
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setUserForm({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
    })
    setIsUserDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setUserForm({ username: "", email: "", password: "", role: "user" })
    setIsUserDialogOpen(true)
  }

  const openBookingDialog = (event: Event) => {
    setSelectedEvent(event)
    setBookingForm({
      eventId: event.id.toString(),
      ticketsCount: 1,
    })
    setIsBookingDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
      minimumFractionDigits: 2,
    }).format(price)
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access the user management system</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{currentUser.username}</span>
                <Badge variant={currentUser.role === "admin" ? "default" : "secondary"} className="ml-2">
                  {currentUser.role}
                </Badge>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Користувачі
              </TabsTrigger>
              <TabsTrigger value="events">
                <Calendar className="h-4 w-4 mr-2" />
                Події
              </TabsTrigger>
              <TabsTrigger value="bookings">
                <Ticket className="h-4 w-4 mr-2" />
                Мої бронювання
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageCircle className="h-4 w-4 mr-2" />
                Чат
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Користувачі</h2>
                {currentUser.role === "admin" && (
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Додати користувача
                  </Button>
                )}
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Ім'я користувача</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Створено</TableHead>
                        {currentUser.role === "admin" && <TableHead>Дії</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                          </TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          {currentUser.role === "admin" && (
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={user.id === currentUser.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Події</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle>{event.name}</CardTitle>
                      <CardDescription>{event.location}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">{event.description}</p>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Дата:</span>
                          <div>{formatDate(event.event_date)}</div>
                        </div>
                        <div>
                          <span className="font-medium">Ціна:</span>
                          <div className="font-bold text-green-600">{formatPrice(event.price)}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <Badge variant={event.available_tickets > 0 ? "outline" : "destructive"}>
                            {event.available_tickets > 0 ? `Доступно: ${event.available_tickets}` : "Квитки відсутні"}
                          </Badge>
                        </div>
                        <Button onClick={() => openBookingDialog(event)} disabled={event.available_tickets <= 0}>
                          Забронювати
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Мої бронювання</h2>
              </div>

              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">
                      У вас ще немає бронювань. Перейдіть до розділу "Події", щоб забронювати квитки.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className={booking.status === "cancelled" ? "opacity-60" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle>{booking.name}</CardTitle>
                          <Badge variant={booking.status === "active" ? "default" : "secondary"}>
                            {booking.status === "active" ? "Активне" : "Скасовано"}
                          </Badge>
                        </div>
                        <CardDescription>{booking.location}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Дата події:</span>
                            <div>{formatDate(booking.event_date)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Дата бронювання:</span>
                            <div>{formatDate(booking.booking_date)}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Кількість квитків:</span>
                            <div>{booking.tickets_count}</div>
                          </div>
                          <div>
                            <span className="font-medium">Загальна вартість:</span>
                            <div className="font-bold text-green-600">
                              {formatPrice(booking.price * booking.tickets_count)}
                            </div>
                          </div>
                        </div>

                        {booking.status === "active" && (
                          <div className="flex justify-end">
                            <Button variant="destructive" size="sm" onClick={() => handleCancelBooking(booking.id)}>
                              Скасувати бронювання
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Чат</h2>
              </div>

              <Card>
                <CardContent className="p-6">
                  <Chat currentUser={currentUser} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Редагувати користувача" : "Створити нового користувача"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Оновіть інформацію користувача нижче."
                : "Заповніть деталі для створення нового користувача."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Ім'я користувача
                </Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Пароль
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="col-span-3"
                  required={!editingUser}
                  placeholder={editingUser ? "Залиште порожнім, щоб зберегти поточний пароль" : ""}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Роль
                </Label>
                <Select
                  value={userForm.role}
                  onValueChange={(value: "admin" | "user") => setUserForm({ ...userForm, role: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Користувач</SelectItem>
                    <SelectItem value="admin">Адміністратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Збереження..." : editingUser ? "Оновити користувача" : "Створити користувача"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Забронювати квитки</DialogTitle>
            <DialogDescription>{selectedEvent && `Бронювання квитків на "${selectedEvent.name}"`}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBooking}>
            <div className="grid gap-4 py-4">
              {selectedEvent && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="event" className="text-right">
                      Подія
                    </Label>
                    <div className="col-span-3 font-medium">{selectedEvent.name}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                      Дата
                    </Label>
                    <div className="col-span-3">{formatDate(selectedEvent.event_date)}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Ціна за квиток
                    </Label>
                    <div className="col-span-3 font-bold text-green-600">{formatPrice(selectedEvent.price)}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="available" className="text-right">
                      Доступно
                    </Label>
                    <div className="col-span-3">{selectedEvent.available_tickets} квитків</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="ticketsCount" className="text-right">
                      Кількість квитків
                    </Label>
                    <Input
                      id="ticketsCount"
                      type="number"
                      min="1"
                      max={selectedEvent.available_tickets}
                      value={bookingForm.ticketsCount}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, ticketsCount: Number.parseInt(e.target.value) || 1 })
                      }
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="totalPrice" className="text-right">
                      Загальна вартість
                    </Label>
                    <div className="col-span-3 font-bold text-green-600">
                      {formatPrice(selectedEvent.price * bookingForm.ticketsCount)}
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Бронювання..." : "Забронювати квитки"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
