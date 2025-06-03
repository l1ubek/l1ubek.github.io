const { Server } = require("socket.io")
const jwt = require("jsonwebtoken")
const { Pool } = require("pg")

const pool = new Pool({
  user: "myuser",
  host: "localhost",
  database: "postgres",
  password: "mysecretpassword",
  port: 5430,
})

const JWT_SECRET = process.env.JWT_SECRET

function initializeWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:8000",
      methods: ["GET", "POST"],
    },
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error("Authentication error"))
      }

      const decoded = jwt.verify(token, JWT_SECRET)
      socket.userId = decoded.userId
      socket.username = decoded.username
      socket.role = decoded.role

      next()
    } catch (err) {
      next(new Error("Authentication error"))
    }
  })

  io.on("connection", async (socket) => {
    console.log(`User ${socket.username} connected`)

    // Join user to their chat rooms
    try {
      const client = await pool.connect()
      const result = await client.query(
        `SELECT DISTINCT cr.id, cr.name 
         FROM chat_rooms cr
         JOIN chat_participants cp ON cr.id = cp.room_id
         WHERE cp.user_id = $1`,
        [socket.userId],
      )

      result.rows.forEach((room) => {
        socket.join(`room_${room.id}`)
      })

      client.release()
    } catch (error) {
      console.error("Error joining rooms:", error)
    }

    // Handle joining a room
    socket.on("join_room", async (roomId) => {
      try {
        const client = await pool.connect()

        // Check if user is participant
        const result = await client.query("SELECT 1 FROM chat_participants WHERE room_id = $1 AND user_id = $2", [
          roomId,
          socket.userId,
        ])

        if (result.rows.length > 0) {
          socket.join(`room_${roomId}`)
          socket.emit("joined_room", roomId)
        }

        client.release()
      } catch (error) {
        console.error("Error joining room:", error)
      }
    })

    // Handle sending a message
    socket.on("send_message", async (data) => {
      try {
        const client = await pool.connect()

        // Check if user is participant
        const participantCheck = await client.query(
          "SELECT 1 FROM chat_participants WHERE room_id = $1 AND user_id = $2",
          [data.roomId, socket.userId],
        )

        if (participantCheck.rows.length === 0) {
          socket.emit("error", "You are not a participant in this room")
          client.release()
          return
        }

        // Insert message
        const result = await client.query(
          `INSERT INTO messages (room_id, sender_id, content, message_type) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, content, message_type, sent_at`,
          [data.roomId, socket.userId, data.content, data.messageType || "text"],
        )

        const message = {
          id: result.rows[0].id,
          roomId: data.roomId,
          senderId: socket.userId,
          senderUsername: socket.username,
          content: result.rows[0].content,
          messageType: result.rows[0].message_type,
          sentAt: result.rows[0].sent_at,
        }

        // Broadcast message to room
        io.to(`room_${data.roomId}`).emit("new_message", message)

        client.release()
      } catch (error) {
        console.error("Error sending message:", error)
        socket.emit("error", "Failed to send message")
      }
    })

    // Handle creating a private chat
    socket.on("create_private_chat", async (targetUserId) => {
      try {
        const client = await pool.connect()

        // Check if private chat already exists
        const existingChat = await client.query(
          `SELECT cr.id FROM chat_rooms cr
           JOIN chat_participants cp1 ON cr.id = cp1.room_id
           JOIN chat_participants cp2 ON cr.id = cp2.room_id
           WHERE cr.type = 'private' 
           AND cp1.user_id = $1 AND cp2.user_id = $2`,
          [socket.userId, targetUserId],
        )

        let roomId

        if (existingChat.rows.length > 0) {
          roomId = existingChat.rows[0].id
        } else {
          // Create new private chat
          const roomResult = await client.query(
            "INSERT INTO chat_rooms (name, type, created_by) VALUES ($1, 'private', $2) RETURNING id",
            [`Private chat`, socket.userId],
          )

          roomId = roomResult.rows[0].id

          // Add participants
          await client.query("INSERT INTO chat_participants (room_id, user_id) VALUES ($1, $2), ($1, $3)", [
            roomId,
            socket.userId,
            targetUserId,
          ])
        }

        // Join both users to the room
        socket.join(`room_${roomId}`)

        // Notify target user if online
        socket.to(`user_${targetUserId}`).emit("new_private_chat", {
          roomId,
          withUser: socket.username,
        })

        socket.emit("private_chat_created", { roomId, withUserId: targetUserId })

        client.release()
      } catch (error) {
        console.error("Error creating private chat:", error)
        socket.emit("error", "Failed to create private chat")
      }
    })

    // Handle getting chat history
    socket.on("get_chat_history", async (roomId) => {
      try {
        const client = await pool.connect()

        // Check if user is participant
        const participantCheck = await client.query(
          "SELECT 1 FROM chat_participants WHERE room_id = $1 AND user_id = $2",
          [roomId, socket.userId],
        )

        if (participantCheck.rows.length === 0) {
          socket.emit("error", "You are not a participant in this room")
          client.release()
          return
        }

        // Get messages
        const result = await client.query(
          `SELECT m.id, m.content, m.message_type, m.sent_at, m.edited_at,
                  u.username as sender_username, u.id as sender_id
           FROM messages m
           JOIN users u ON m.sender_id = u.id
           WHERE m.room_id = $1 AND m.is_deleted = FALSE
           ORDER BY m.sent_at ASC
           LIMIT 100`,
          [roomId],
        )

        const messages = result.rows.map((row) => ({
          id: row.id,
          roomId,
          senderId: row.sender_id,
          senderUsername: row.sender_username,
          content: row.content,
          messageType: row.message_type,
          sentAt: row.sent_at,
          editedAt: row.edited_at,
        }))

        socket.emit("chat_history", { roomId, messages })

        client.release()
      } catch (error) {
        console.error("Error getting chat history:", error)
        socket.emit("error", "Failed to get chat history")
      }
    })

    // Handle user typing
    socket.on("typing", (data) => {
      socket.to(`room_${data.roomId}`).emit("user_typing", {
        userId: socket.userId,
        username: socket.username,
        isTyping: data.isTyping,
      })
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.username} disconnected`)
    })
  })

  return io
}

module.exports = { initializeWebSocket }
