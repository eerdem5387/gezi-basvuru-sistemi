import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateTripSchema } from "@/lib/validations"
import { validateServiceRequest } from "@/lib/service-auth"
import {
  badRequestResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/http"

interface RouteParams {
  params: { tripId: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateServiceRequest(request)) {
      return unauthorizedResponse()
    }

    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Gezi bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ data: trip })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateServiceRequest(request)) {
      return unauthorizedResponse()
    }

    const payload = await request.json()
    const parsed = updateTripSchema.safeParse(payload)

    if (!parsed.success) {
      return badRequestResponse("Gezi verisi doğrulanamadı", parsed.error.flatten())
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = {}

    if (Object.prototype.hasOwnProperty.call(data, "title")) {
      updateData.title = data.title
    }
    if (Object.prototype.hasOwnProperty.call(data, "description")) {
      updateData.description = data.description ?? null
    }
    if (Object.prototype.hasOwnProperty.call(data, "extraNotes")) {
      updateData.extraNotes = data.extraNotes ?? null
    }
    if (Object.prototype.hasOwnProperty.call(data, "location") && data.location) {
      updateData.location = data.location
    }
    if (Object.prototype.hasOwnProperty.call(data, "startDate") && data.startDate) {
      updateData.startDate = new Date(data.startDate)
    }
    if (Object.prototype.hasOwnProperty.call(data, "endDate") && data.endDate) {
      updateData.endDate = new Date(data.endDate)
    }
    if (Object.prototype.hasOwnProperty.call(data, "price")) {
      updateData.price = data.price
    }
    if (Object.prototype.hasOwnProperty.call(data, "quota")) {
      updateData.quota = data.quota
    }
    if (Object.prototype.hasOwnProperty.call(data, "isActive") && data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }

    if (Object.keys(updateData).length === 0) {
      return badRequestResponse("Güncellenecek alan bulunamadı")
    }

    const trip = await prisma.trip.update({
      where: { id: params.tripId },
      data: updateData,
    })

    return NextResponse.json({ data: trip })
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Gezi bulunamadı" }, { status: 404 })
    }
    return serverErrorResponse(error)
  }
}

