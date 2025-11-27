import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { serverErrorResponse } from "@/lib/http"

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const trips = await prisma.trip.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: now,
        },
      },
      orderBy: {
        startDate: "asc",
      },
    })

    // Convert Decimal to number for JSON serialization
    const tripsWithNumbers = trips.map((trip) => ({
      ...trip,
      price: trip.price ? Number(trip.price) : null,
    }))

    const response = NextResponse.json({ data: tripsWithNumbers })
    // Public endpoint, allow CORS for all origins
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    return response
  } catch (error) {
    console.error("Error fetching public trips:", error)
    return serverErrorResponse(error, request)
  }
}
