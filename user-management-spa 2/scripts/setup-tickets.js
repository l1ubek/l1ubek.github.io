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

async function setupTickets() {
  const client = await pool.connect()

  try {
    console.log("Setting up tickets database...")

    // Read SQL file
    const sqlFilePath = path.join(__dirname, "..", "database", "tickets.sql")
    const sqlCommands = fs.readFileSync(sqlFilePath, "utf8")

    // Execute SQL commands
    await client.query(sqlCommands)

    // Verify events were created
    const eventsResult = await client.query("SELECT id, name, available_tickets FROM events")
    console.log("\n📋 Created events:")
    eventsResult.rows.forEach((event) => {
      console.log(`- ${event.name} (Available tickets: ${event.available_tickets})`)
    })

    console.log("\n✅ Tickets database setup successfully!")
  } catch (error) {
    console.error("❌ Error setting up tickets database:", error)
  } finally {
    client.release()
    await pool.end()
  }
}

setupTickets()
