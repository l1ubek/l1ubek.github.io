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

export async function GET(request: NextRequest) {
  try {
    // Verify token but don't require specific role
    verifyToken(request)

    const client = await pool.connect()

    try {
      const result = await client.query(`
        SELECT 
          id, name, description, 
          event_date, location, 
          total_tickets, available_tickets, price
        FROM events 
        ORDER BY event_date
      `)

      return NextResponse.json(result.rows)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
