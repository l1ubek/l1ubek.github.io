import { NextRequest } from "next/server"
import { jest } from "@jest/globals"

export const createMockRequest = (url: string, options: any = {}) => {
  return new NextRequest(url, {
    method: "GET",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
}

export const createAuthenticatedRequest = (url: string, token = "valid-token", options: any = {}) => {
  return createMockRequest(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

export const mockDatabaseClient = () => {
  return {
    query: jest.fn(),
    release: jest.fn(),
  }
}

export const mockPool = () => {
  const client = mockDatabaseClient()
  return {
    connect: jest.fn().mockResolvedValue(client),
    client,
  }
}

export const mockUser = (overrides: any = {}) => ({
  id: 1,
  username: "testuser",
  email: "test@example.com",
  role: "user",
  created_at: "2023-01-01T00:00:00Z",
  ...overrides,
})

export const mockEvent = (overrides: any = {}) => ({
  id: 1,
  name: "Test Event",
  description: "Test event description",
  event_date: "2025-06-15T19:00:00Z",
  location: "Test Location",
  total_tickets: 100,
  available_tickets: 80,
  price: 500.0,
  ...overrides,
})

export const mockBooking = (overrides: any = {}) => ({
  id: 1,
  user_id: 1,
  event_id: 1,
  tickets_count: 2,
  booking_date: "2023-01-01T10:00:00Z",
  status: "active",
  ...overrides,
})
