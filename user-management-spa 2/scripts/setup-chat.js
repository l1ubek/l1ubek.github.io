const { Pool } = require("pg")
const fs = require("fs")
const path = require("path")

const pool = new Pool({
  user: "myuser",
  host: "localhost",
  database: "postgres",
  password: "mysecretpassword",
  port: 5430,
})

async function setupChat() {
  const client = await pool.connect()

  try {
    console.log("Setting up chat database...")

    // Read SQL file
    const sqlFilePath = path.join(__dirname, "..", "database", "chat.sql")
    const sqlCommands = fs.readFileSync(sqlFilePath, "utf8")

    // Execute SQL commands
    await client.query(sqlCommands)

    // Verify chat rooms were created
    const roomsResult = await client.query("SELECT id, name, type FROM chat_rooms")
    console.log("\n📋 Created chat rooms:")
    roomsResult.rows.forEach((room) => {
      console.log(`- ${room.name} (${room.type})`)
    })

    console.log("\n✅ Chat database setup successfully!")
  } catch (error) {
    console.error("❌ Error setting up chat database:", error)
  } finally {
    client.release()
    await pool.end()
  }
}

setupChat()
