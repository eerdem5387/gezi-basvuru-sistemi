import { NextRequest, NextResponse } from "next/server"

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://okul-yonetim-sistemi.vercel.app",
  "https://yonetim.leventokullari.com",
  "http://localhost:3000",
  "http://localhost:3001",
]

// Helper function to add CORS headers to response
function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get("origin")
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
  }
  
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Service-Secret"
  )
  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.set("Access-Control-Max-Age", "86400")
  
  return response
}

export function unauthorizedResponse(request?: NextRequest) {
  const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return request ? addCorsHeaders(response, request) : response
}

export function badRequestResponse(message: string, details?: unknown, request?: NextRequest) {
  const responseBody: { error: string; details?: unknown } = { error: message }
  if (details) {
    responseBody.details = details
  }
  const response = NextResponse.json(responseBody, { status: 400 })
  return request ? addCorsHeaders(response, request) : response
}

export function serverErrorResponse(error: unknown, request?: NextRequest) {
  console.error(error)
  const response = NextResponse.json(
    {
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 }
  )
  return request ? addCorsHeaders(response, request) : response
}

// Helper function to create a response with CORS headers
export function corsResponse(data: unknown, status: number = 200, request?: NextRequest) {
  const response = NextResponse.json(data, { status })
  return request ? addCorsHeaders(response, request) : response
}
