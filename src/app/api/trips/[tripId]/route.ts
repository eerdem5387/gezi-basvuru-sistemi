import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateTripSchema } from "@/lib/validations"
import { validateServiceRequest } from "@/lib/service-auth"
import {
  badRequestResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/http"

type RouteContext = { params: Promise<{ tripId: string }> }

async function resolveTripId(context: RouteContext) {
  return (await context.params).tripId
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (!validateServiceRequest(request)) {
      return unauthorizedResponse(request)
    }

    const tripId = await resolveTripId(context)
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    })

    if (!trip) {
      const response = NextResponse.json({ error: "Gezi bulunamadı" }, { status: 404 })
      const origin = request.headers.get("origin")
      const allowedOrigins = [
        "https://okul-yonetim-sistemi.vercel.app",
        "https://yonetim.leventokullari.com",
        "http://localhost:3000",
        "http://localhost:3001",
      ]
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin)
        response.headers.set("Access-Control-Allow-Credentials", "true")
      }
      return response
    }

    const response = NextResponse.json({ data: trip })
    const origin = request.headers.get("origin")
    const allowedOrigins = [
      "https://okul-yonetim-sistemi.vercel.app",
      "https://yonetim.leventokullari.com",
      "http://localhost:3000",
      "http://localhost:3001",
    ]
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }
    return response
  } catch (error) {
    return serverErrorResponse(error, request)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!validateServiceRequest(request)) {
      return unauthorizedResponse(request)
    }

    const tripId = await resolveTripId(context)
    const payload = await request.json()
    const parsed = updateTripSchema.safeParse(payload)

    if (!parsed.success) {
      return badRequestResponse("Gezi verisi doğrulanamadı", parsed.error.flatten(), request)
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
      return badRequestResponse("Güncellenecek alan bulunamadı", undefined, request)
    }

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
    })

    const response = NextResponse.json({ data: trip })
    const origin = request.headers.get("origin")
    const allowedOrigins = [
      "https://okul-yonetim-sistemi.vercel.app",
      "https://yonetim.leventokullari.com",
      "http://localhost:3000",
      "http://localhost:3001",
    ]
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }
    return response
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      const response = NextResponse.json({ error: "Gezi bulunamadı" }, { status: 404 })
      const origin = request.headers.get("origin")
      const allowedOrigins = [
        "https://okul-yonetim-sistemi.vercel.app",
        "https://yonetim.leventokullari.com",
        "http://localhost:3000",
        "http://localhost:3001",
      ]
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin)
        response.headers.set("Access-Control-Allow-Credentials", "true")
      }
      return response
    }
    return serverErrorResponse(error, request)
  }
}

