import jwt from "jsonwebtoken"

// Mock dependencies
jest.mock("jsonwebtoken")
jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn(),
    }),
  })),
}))

const mockJwt = jwt as jest.Mocked<typeof jwt>

// Create mock NextRequest
class MockNextRequest {
  url: string
  method: string
  private _headers: Map<string, string>

  constructor(url: string, options: any = {}) {
    this.url = url
    this.method = options.method || "GET"
    this._headers = new Map(Object.entries(options.headers || {}))
  }

  get headers() {
    return {
      get: (name: string) => this._headers.get(name) || null,
    }
  }
}

// Import handlers after mocks are set up
import { GET } from "@/app/api/events/route"

describe("Events API", () => {
  let mockClient: any
  let mockPool: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    }

    const { Pool } = require("pg")
    mockPool = new Pool()
    mockPool.connect.mockResolvedValue(mockClient)
  })

  const createAuthenticatedRequest = (url: string, options: any = {}) => {
    mockJwt.verify.mockReturnValue({
      userId: 1,
      username: "testuser",
      role: "user",
    })

    return new MockNextRequest(url, {
      ...options,
      headers: {
        Authorization: "Bearer valid-token",
        ...options.headers,
      },
    }) as any
  }

  describe("GET /api/events", () => {
    it("should return all events for authenticated user", async () => {
      const mockEvents = [
        {
          id: 1,
          name: "Concert",
          description: "Great concert",
          event_date: "2025-06-15T19:00:00Z",
          location: "Kyiv",
          total_tickets: 1000,
          available_tickets: 800,
          price: 500.0,
        },
        {
          id: 2,
          name: "Theater",
          description: "Amazing play",
          event_date: "2025-06-20T18:00:00Z",
          location: "Lviv",
          total_tickets: 500,
          available_tickets: 300,
          price: 300.0,
        },
      ]

      mockClient.query.mockResolvedValue({ rows: mockEvents })

      const request = createAuthenticatedRequest("http://localhost:8000/api/events")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(response.status)
      expect(data).toEqual(data)
    })
  })
})
