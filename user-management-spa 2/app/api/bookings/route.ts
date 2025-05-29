import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { Pool } from "pg"

const pool = new Pool({
  user: "myuser",
  host: "localhost",
  database: "postgres",
  password: "mysecretpassword",
  port: 5430,
})

const JWT_SECRET = process.env.JWT_SECRET!

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided")
  }

  const token = authHeader.substring(7)
  return jwt.verify(token, JWT_SECRET) as any
}

// Get user's bookings
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    const userId = decoded.userId

    const client = await pool.connect()

    try {
      const result = await client.query(
        `
        SELECT 
          b.id, b.tickets_count, b.booking_date, b.status,
          e.id as event_id, e.name, e.description, e.event_date, e.location, e.price
        FROM bookings b
        JOIN events e ON b.event_id = e.id
        WHERE b.user_id = $1
        ORDER BY b.booking_date DESC
      `,
        [userId],
      )

      return NextResponse.json(result.rows)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// Create a new booking
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    const userId = decoded.userId

    const { eventId, ticketsCount } = await request.json()

    if (!eventId || !ticketsCount || ticketsCount < 1) {
      return NextResponse.json({ error: "Event ID and tickets count are required" }, { status: 400 })
    }

    const client = await pool.connect()

    try {
      // Start transaction
      await client.query("BEGIN")

      // Check if event exists and has enough tickets
      const eventResult = await client.query("SELECT id, available_tickets FROM events WHERE id = $1 FOR UPDATE", [
        eventId,
      ])

      if (eventResult.rows.length === 0) {
        await client.query("ROLLBACK")
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }

      const event = eventResult.rows[0]

      if (event.available_tickets < ticketsCount) {
        await client.query("ROLLBACK")
        return NextResponse.json(
          {
            error: "Not enough tickets available",
            availableTickets: event.available_tickets,
          },
          { status: 400 },
        )
      }

      // Check if user already has a booking for this event
      const existingBooking = await client.query("SELECT id FROM bookings WHERE user_id = $1 AND event_id = $2", [
        userId,
        eventId,
      ])

      if (existingBooking.rows.length > 0) {
        await client.query("ROLLBACK")
        return NextResponse.json({ error: "You already have a booking for this event" }, { status: 400 })
      }

      // Create booking
      const bookingResult = await client.query(
        `INSERT INTO bookings (user_id, event_id, tickets_count) 
         VALUES ($1, $2, $3) 
         RETURNING id, tickets_count, booking_date, status`,
        [userId, eventId, ticketsCount],
      )

      // Update available tickets
      await client.query("UPDATE events SET available_tickets = available_tickets - $1 WHERE id = $2", [
        ticketsCount,
        eventId,
      ])

      // Commit transaction
      await client.query("COMMIT")

      return NextResponse.json(bookingResult.rows[0], { status: 201 })
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Create booking error:", error)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
