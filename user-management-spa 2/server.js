const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = 8000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  // Initialize WebSocket after Next.js is ready
  if (dev) {
    // In development, dynamically import the WebSocket server
    import("./lib/websocket-server.js")
      .then(({ initializeWebSocket }) => {
        initializeWebSocket(server)
        console.log("WebSocket server initialized")
      })
      .catch((err) => {
        console.error("Failed to initialize WebSocket:", err)
      })
  } else {
    // In production, require the compiled version
    const { initializeWebSocket } = require("./lib/websocket-server.js")
    initializeWebSocket(server)
  }

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
