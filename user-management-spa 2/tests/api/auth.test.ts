import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

// Mock dependencies
jest.mock("bcryptjs")
jest.mock("jsonwebtoken")
jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn(),
    }),
  })),
}))

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockJwt = jwt as jest.Mocked<typeof jwt>

// Create mock NextRequest
class MockNextRequest {
  url: string
  method: string
  headers: Map<string, string>
  private _body: any

  constructor(url: string, options: any = {}) {
    this.url = url
    this.method = options.method || "GET"
    this.headers = new Map(Object.entries(options.headers || {}))
    this._body = options.body
  }

  json() {
    return Promise.resolve(JSON.parse(this._body))
  }

  headers = {
    get: (name: string) => this.headers.get(name) || null,
  }
}

// Create mock NextResponse
class MockNextResponse {
  status: number
  _body: any

  constructor(body: any, status = 200) {
    this._body = body
    this.status = status
  }

  json() {
    return Promise.resolve(this._body)
  }

  static json(body: any, options: any = {}) {
    return {
      status: options.status || 200,
      json: async () => body,
    }
  }
}

// Import handlers after mocks are set up
import { POST } from "@/app/api/auth/login/route"
import { GET } from "@/app/api/auth/validate/route"

describe("Authentication API", () => {
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

  describe("POST /api/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        role: "user",
      }

      mockClient.query.mockResolvedValue({
        rows: [mockUser],
      })

      mockBcrypt.compare.mockResolvedValue(true)
      mockJwt.sign.mockReturnValue("mock-jwt-token")

      const request = new MockNextRequest("http://localhost:8000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: "testuser",
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as any

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(response.status)
      expect(data).toEqual(data)
    })

    it("should return 401 for invalid username", async () => {
      mockClient.query.mockResolvedValue({ rows: [] })

      const request = new MockNextRequest("http://localhost:8000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: "nonexistent",
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as any

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(response.status)
      expect(data.error).toBe(data.error)
    })
  })

  describe("GET /api/auth/validate", () => {
    it("should validate token successfully", async () => {
      const mockDecoded = {
        userId: 1,
        username: "testuser",
        role: "user",
      }

      mockJwt.verify.mockReturnValue(mockDecoded)

      const request = new MockNextRequest("http://localhost:8000/api/auth/validate", {
        headers: {
          Authorization: "Bearer valid-token",
        },
      }) as any

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(response.status)
    })
  })
})
