import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createTripSchema } from "@/lib/validations"
import { validateServiceRequest } from "@/lib/service-auth"
import {
  badRequestResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/http"

export async function GET(request: NextRequest) {
  try {
    if (!validateServiceRequest(request)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const isActiveParam = searchParams.get("isActive")
    const q = searchParams.get("q")
    const upcomingOnly = searchParams.get("upcoming") === "true"

    const where: Prisma.TripWhereInput = {}

    if (isActiveParam !== null) {
      where.isActive = isActiveParam === "true"
    }

    if (upcomingOnly) {
      where.startDate = {
        gte: new Date(),
      }
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ]
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: {
        startDate: "asc",
      },
    })

    return NextResponse.json({ data: trips })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateServiceRequest(request)) {
      return unauthorizedResponse()
    }

    const payload = await request.json()
    const parsed = createTripSchema.safeParse(payload)

    if (!parsed.success) {
      return badRequestResponse("Gezi verisi doğrulanamadı", parsed.error.flatten())
    }

    const data = parsed.data

    const trip = await prisma.trip.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        extraNotes: data.extraNotes ?? null,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        price: data.price,
        quota: data.quota,
        isActive: data.isActive ?? true,
      },
    })

    return NextResponse.json({ data: trip }, { status: 201 })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

