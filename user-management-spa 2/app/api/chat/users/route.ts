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
    const decoded = verifyToken(request)
    const userId = decoded.userId

    const client = await pool.connect()

    try {
      const result = await client.query(
        "SELECT id, username, email, role FROM users WHERE id != $1 ORDER BY username",
        [userId],
      )

      return NextResponse.json(result.rows)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Get chat users error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
