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

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided")
  }

  const token = authHeader.substring(7)
  return jwt.verify(token, JWT_SECRET) as any
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = verifyToken(request)

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const userId = Number.parseInt(params.id)
    const { username, email, password, role } = await request.json()

    if (!username || !email || !role) {
      return NextResponse.json({ error: "Username, email, and role are required" }, { status: 400 })
    }

    if (!["admin", "user"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const client = await pool.connect()

    try {
      // Check if username or email already exists for other users
      const existingUser = await client.query("SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3", [
        username,
        email,
        userId,
      ])

      if (existingUser.rows.length > 0) {
        return NextResponse.json({ error: "Username or email already exists" }, { status: 400 })
      }

      let query = "UPDATE users SET username = $1, email = $2, role = $3"
      const params = [username, email, role]

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10)
        query += ", password = $4"
        params.push(hashedPassword)
      }

      query += " WHERE id = $" + (params.length + 1) + " RETURNING id, username, email, role, created_at"
      params.push(userId.toString())

      const result = await client.query(query, params)

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json(result.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = verifyToken(request)

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const userId = Number.parseInt(params.id)

    // Prevent admin from deleting themselves
    if (userId === decoded.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const client = await pool.connect()

    try {
      const result = await client.query("DELETE FROM users WHERE id = $1 RETURNING id", [userId])

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json({ message: "User deleted successfully" })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
