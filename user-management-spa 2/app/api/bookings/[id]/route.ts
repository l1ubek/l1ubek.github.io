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

// Cancel a booking
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = verifyToken(request)
    const userId = decoded.userId
    const bookingId = Number.parseInt(params.id)

    const client = await pool.connect()

    try {
      // Start transaction
      await client.query("BEGIN")

      // Get booking details
      const bookingResult = await client.query(
        `SELECT id, user_id, event_id, tickets_count, status 
         FROM bookings 
         WHERE id = $1 FOR UPDATE`,
        [bookingId],
      )

      if (bookingResult.rows.length === 0) {
        await client.query("ROLLBACK")
        return NextResponse.json({ error: "Booking not found" }, { status: 404 })
      }

      const booking = bookingResult.rows[0]

      // Check if booking belongs to user
      if (booking.user_id !== userId) {
        await client.query("ROLLBACK")
        return NextResponse.json({ error: "You can only cancel your own bookings" }, { status: 403 })
      }

      // Check if booking is already cancelled
      if (booking.status === "cancelled") {
        await client.query("ROLLBACK")
        return NextResponse.json({ error: "Booking is already cancelled" }, { status: 400 })
      }

      // Update booking status
      await client.query("UPDATE bookings SET status = $1 WHERE id = $2", ["cancelled", bookingId])

      // Return tickets to available pool
      await client.query("UPDATE events SET available_tickets = available_tickets + $1 WHERE id = $2", [
        booking.tickets_count,
        booking.event_id,
      ])

      // Commit transaction
      await client.query("COMMIT")

      return NextResponse.json({ message: "Booking cancelled successfully" })
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Cancel booking error:", error)
      return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Cancel booking error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
