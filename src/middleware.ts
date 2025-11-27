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

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.includes(origin)
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin")
  const isAllowed = isOriginAllowed(origin)

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 200 })
      
      if (isAllowed && origin) {
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

    // For actual requests, we need to add headers to the response
    // We'll use a custom header to pass the origin info to route handlers
    const response = NextResponse.next()
    
    if (isAllowed && origin) {
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

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}

