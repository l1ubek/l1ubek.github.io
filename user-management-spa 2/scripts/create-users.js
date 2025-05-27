const bcrypt = require("bcryptjs")
const { Pool } = require("pg")

const pool = new Pool({
  user: "myuser",
  host: "localhost",
  database: "postgres",
  password: "mysecretpassword",
  port: 5430,
})

async function createDefaultUsers() {
  const client = await pool.connect()

  try {
    // Drop and recreate table
    await client.query("DROP TABLE IF EXISTS users")

    await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)

    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 10)
    const userPassword = await bcrypt.hash("user123", 10)

    // Insert admin user
    await client.query("INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)", [
      "admin",
      "admin@example.com",
      adminPassword,
      "admin",
    ])

    // Insert regular user
    await client.query("INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)", [
      "user",
      "user@example.com",
      userPassword,
      "user",
    ])

    console.log("✅ Default users created successfully!")
    console.log("Admin: admin / admin123")
    console.log("User: user / user123")

    // Verify users were created
    const result = await client.query("SELECT username, email, role FROM users")
    console.log("\n📋 Created users:")
    result.rows.forEach((user) => {
      console.log(`- ${user.username} (${user.email}) - ${user.role}`)
    })
  } catch (error) {
    console.error("❌ Error creating users:", error)
  } finally {
    client.release()
    await pool.end()
  }
}

createDefaultUsers()
