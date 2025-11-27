import { NextRequest, NextResponse } from "next/server"

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://okul-yonetim-sistemi.vercel.app",
  "https://yonetim.leventokullari.com",
  "http://localhost:3000",
  "http://localhost:3001",
  // Allow any Vercel preview deployments
  ...(process.env.VERCEL_URL
    ? [`https://${process.env.VERCEL_URL}`]
    : []),
]

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin")
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    const response = NextResponse.next()

    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin)
    }

    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Service-Secret"
    )
    response.headers.set("Access-Control-Allow-Credentials", "true")
    response.headers.set("Access-Control-Max-Age", "86400")

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      })
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}

