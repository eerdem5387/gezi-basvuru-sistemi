import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateServiceRequest } from "@/lib/service-auth"
import { serverErrorResponse, unauthorizedResponse } from "@/lib/http"

export async function GET(request: NextRequest) {
  try {
    if (!validateServiceRequest(request)) {
      return unauthorizedResponse(request)
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalTrips, activeTrips, upcomingTrips, totalApplications, monthlyApplications] =
      await Promise.all([
        prisma.trip.count(),
        prisma.trip.count({ where: { isActive: true } }),
        prisma.trip.count({
          where: {
            startDate: { gte: now },
          },
        }),
        prisma.tripApplication.count(),
        prisma.tripApplication.count({
          where: {
            createdAt: {
              gte: startOfMonth,
            },
          },
        }),
      ])

    const response = NextResponse.json({
      data: {
        totalTrips,
        activeTrips,
        upcomingTrips,
        totalApplications,
        monthlyApplications,
      },
    })
    const origin = request.headers.get("origin")
    const allowedOrigins = [
      "https://okul-yonetim-sistemi.vercel.app",
      "https://yonetim.leventokullari.com",
      "http://localhost:3000",
      "http://localhost:3001",
    ]
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Service-Secret"
      )
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }
    return response
  } catch (error) {
    return serverErrorResponse(error, request)
  }
}

