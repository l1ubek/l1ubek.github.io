import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
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

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    console.log("Login attempt for username:", username)

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const client = await pool.connect()

    try {
      const result = await client.query("SELECT id, username, email, password, role FROM users WHERE username = $1", [
        username,
      ])

      console.log("User found in database:", result.rows.length > 0)

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      const user = result.rows[0]
      console.log("Comparing password for user:", user.username)

      const isValidPassword = await bcrypt.compare(password, user.password)
      console.log("Password valid:", isValidPassword)

      if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, {
        expiresIn: "24h",
      })

      console.log("Login successful for user:", user.username)

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
