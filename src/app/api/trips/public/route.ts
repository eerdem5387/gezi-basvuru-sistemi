import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { serverErrorResponse } from "@/lib/http"

export async function GET() {
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

    return NextResponse.json({ data: trips })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

