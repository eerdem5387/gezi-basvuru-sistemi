import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateServiceRequest } from "@/lib/service-auth"
import { serverErrorResponse, unauthorizedResponse } from "@/lib/http"

export async function GET(request: NextRequest) {
  try {
    if (!validateServiceRequest(request)) {
      return unauthorizedResponse()
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

    return NextResponse.json({
      data: {
        totalTrips,
        activeTrips,
        upcomingTrips,
        totalApplications,
        monthlyApplications,
      },
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

