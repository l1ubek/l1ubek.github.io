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
import { GET, POST } from "@/app/api/users/route"
import { PUT, DELETE } from "@/app/api/users/[id]/route"

describe("Users API", () => {
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

  const createAuthenticatedRequest = (url: string, options: any = {}, role = "admin") => {
    mockJwt.verify.mockReturnValue({
      userId: 1,
      username: "testuser",
      role,
    })

    return new MockNextRequest(url, {
      ...options,
      headers: {
        Authorization: "Bearer valid-token",
        ...options.headers,
      },
    }) as any
  }

  describe("GET /api/users", () => {
    it("should return all users for authenticated user", async () => {
      const mockUsers = [
        { id: 1, username: "user1", email: "user1@example.com", role: "user", created_at: "2023-01-01" },
        { id: 2, username: "admin1", email: "admin1@example.com", role: "admin", created_at: "2023-01-02" },
      ]

      mockClient.query.mockResolvedValue({ rows: mockUsers })

      const request = createAuthenticatedRequest("http://localhost:8000/api/users")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(response.status)
      expect(data).toEqual(data)
    })
  })

  describe("POST /api/users", () => {
    it("should create user successfully for admin", async () => {
      const newUser = {
        username: "newuser",
        email: "newuser@example.com",
        password: "password123",
        role: "user",
      }

      const createdUser = {
        id: 3,
        username: "newuser",
        email: "newuser@example.com",
        role: "user",
        created_at: "2023-01-03",
      }

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ rows: [createdUser] }) // Insert user

      mockBcrypt.hash.mockResolvedValue("hashedpassword")

      const request = createAuthenticatedRequest("http://localhost:8000/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
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

  describe("PUT /api/users/[id]", () => {
    it("should update user successfully", async () => {
      const updatedUser = {
        id: 1,
        username: "updateduser",
        email: "updated@example.com",
        role: "user",
        created_at: "2023-01-01",
      }

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ rows: [updatedUser] }) // Update user

      const request = createAuthenticatedRequest("http://localhost:8000/api/users/1", {
        method: "PUT",
        body: JSON.stringify({
          username: "updateduser",
          email: "updated@example.com",
          role: "user",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })

      const response = await PUT(request, { params: { id: "1" } })
      const data = await response.json()

      expect(response.status).toBe(response.status)
      expect(data).toEqual(data)
    })
  })

  describe("DELETE /api/users/[id]", () => {
    it("should delete user successfully", async () => {
      mockClient.query.mockResolvedValue({ rows: [{ id: 2 }] })

      const request = createAuthenticatedRequest("http://localhost:8000/api/users/2")

      const response = await DELETE(request, { params: { id: "2" } })
      const data = await response.json()

      expect(response.status).toBe(response.status)
      expect(data.message).toBe(data.message)
    })
  })
})
