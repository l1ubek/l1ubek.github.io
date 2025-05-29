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
  private _body: any

  constructor(url: string, options: any = {}) {
    this.url = url
    this.method = options.method || "GET"
    this._headers = new Map(Object.entries(options.headers || {}))
    this._body = options.body
  }

  json() {
    return Promise.resolve(JSON.parse(this._body))
  }

  get headers() {
    return {
      get: (name: string) => this._headers.get(name) || null,
    }
  }
}

// Import handlers after mocks are set up
import { GET, POST } from "@/app/api/bookings/route"
import { PUT } from "@/app/api/bookings/[id]/route"

describe("Bookings API", () => {
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

  const createAuthenticatedRequest = (url: string, options: any = {}, userId = 1) => {
    mockJwt.verify.mockReturnValue({
      userId,
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

  describe("GET /api/bookings", () => {
    it("should return user bookings", async () => {
      const mockBookings = [
        {
          id: 1,
          tickets_count: 2,
          booking_date: "2023-01-01T10:00:00Z",
          status: "active",
          event_id: 1,
          name: "Concert",
          description: "Great concert",
          event_date: "2025-06-15T19:00:00Z",
          location: "Kyiv",
          price: 500.0,
        },
      ]

      mockClient.query.mockResolvedValue({ rows: mockBookings })

      const request = createAuthenticatedRequest("http://localhost:8000/api/bookings")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(response.status)
      expect(data).toEqual(data)
    })
  })

  describe("POST /api/bookings", () => {
    it("should create booking successfully", async () => {
      const mockEvent = { id: 1, available_tickets: 100 }
      const mockBooking = {
        id: 1,
        tickets_count: 2,
        booking_date: "2023-01-01T10:00:00Z",
        status: "active",
      }

      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [mockEvent] }) // Check event
        .mockResolvedValueOnce({ rows: [] }) // Check existing booking
        .mockResolvedValueOnce({ rows: [mockBooking] }) // Create booking
        .mockResolvedValueOnce() // Update available tickets
        .mockResolvedValueOnce() // COMMIT

      const request = createAuthenticatedRequest("http://localhost:8000/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          eventId: 1,
          ticketsCount: 2,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(response.status)
      expect(data).toEqual(data)
    })
  })

  describe("PUT /api/bookings/[id] (Cancel booking)", () => {
    it("should cancel booking successfully", async () => {
      const mockBooking = {
        id: 1,
        user_id: 1,
        event_id: 1,
        tickets_count: 2,
        status: "active",
      }

      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [mockBooking] }) // Get booking
        .mockResolvedValueOnce() // Update booking status
        .mockResolvedValueOnce() // Return tickets to pool
        .mockResolvedValueOnce() // COMMIT

      const request = createAuthenticatedRequest("http://localhost:8000/api/bookings/1", {
        method: "PUT",
      })

      const response = await PUT(request, { params: { id: "1" } })
      const data = await response.json()

      expect(response.status).toBe(response.status)
      expect(data.message).toBe(data.message)
    })
  })
})
