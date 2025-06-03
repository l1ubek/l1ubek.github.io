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
        `SELECT DISTINCT cr.id, cr.name, cr.type, cr.created_at,
                CASE 
                  WHEN cr.type = 'private' THEN (
                    SELECT u.username 
                    FROM chat_participants cp2 
                    JOIN users u ON cp2.user_id = u.id 
                    WHERE cp2.room_id = cr.id AND cp2.user_id != $1 
                    LIMIT 1
                  )
                  ELSE cr.name
                END as display_name,
                (SELECT COUNT(*) FROM chat_participants WHERE room_id = cr.id) as participant_count,
                (SELECT m.content FROM messages m WHERE m.room_id = cr.id ORDER BY m.sent_at DESC LIMIT 1) as last_message,
                (SELECT m.sent_at FROM messages m WHERE m.room_id = cr.id ORDER BY m.sent_at DESC LIMIT 1) as last_message_time
         FROM chat_rooms cr
         JOIN chat_participants cp ON cr.id = cp.room_id
         WHERE cp.user_id = $1
         ORDER BY last_message_time DESC NULLS LAST, cr.created_at DESC`,
        [userId],
      )

      return NextResponse.json(result.rows)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Get chat rooms error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    const userId = decoded.userId

    const { name, type, participantIds } = await request.json()

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    if (!["private", "group"].includes(type)) {
      return NextResponse.json({ error: "Invalid room type" }, { status: 400 })
    }

    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      // Create room
      const roomResult = await client.query(
        "INSERT INTO chat_rooms (name, type, created_by) VALUES ($1, $2, $3) RETURNING id, name, type, created_at",
        [name, type, userId],
      )

      const room = roomResult.rows[0]

      // Add creator as participant
      await client.query("INSERT INTO chat_participants (room_id, user_id) VALUES ($1, $2)", [room.id, userId])

      // Add other participants if provided
      if (participantIds && participantIds.length > 0) {
        const participantValues = participantIds.map((id: number) => `(${room.id}, ${id})`).join(", ")
        await client.query(`INSERT INTO chat_participants (room_id, user_id) VALUES ${participantValues}`)
      }

      await client.query("COMMIT")

      return NextResponse.json(room, { status: 201 })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Create chat room error:", error)
    return NextResponse.json({ error: "Failed to create chat room" }, { status: 500 })
  }
}
