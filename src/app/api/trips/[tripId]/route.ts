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
    
    if (!tripId || typeof tripId !== "string") {
      return badRequestResponse("Geçersiz gezi ID", undefined, request)
    }

    let payload: unknown
    try {
      payload = await request.json()
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError)
      return badRequestResponse("Geçersiz JSON formatı", undefined, request)
    }

    if (!payload || typeof payload !== "object") {
      return badRequestResponse("Geçersiz veri formatı", undefined, request)
    }

    const parsed = updateTripSchema.safeParse(payload)

    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten())
      return badRequestResponse("Gezi verisi doğrulanamadı", parsed.error.flatten(), request)
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = {}

    if (Object.prototype.hasOwnProperty.call(data, "title")) {
      if (typeof data.title !== "string" || !data.title.trim()) {
        return badRequestResponse("Gezi adı geçersiz", undefined, request)
      }
      updateData.title = data.title.trim()
    }
    if (Object.prototype.hasOwnProperty.call(data, "description")) {
      updateData.description = data.description ?? null
    }
    if (Object.prototype.hasOwnProperty.call(data, "extraNotes")) {
      updateData.extraNotes = data.extraNotes ?? null
    }
    if (Object.prototype.hasOwnProperty.call(data, "location")) {
      if (data.location && typeof data.location === "string") {
        if (!data.location.trim()) {
          return badRequestResponse("Konum boş olamaz", undefined, request)
        }
        updateData.location = data.location.trim()
      }
    }
    if (Object.prototype.hasOwnProperty.call(data, "startDate") && data.startDate) {
      const date = new Date(data.startDate)
      if (isNaN(date.getTime())) {
        return badRequestResponse("Geçersiz başlangıç tarihi", undefined, request)
      }
      updateData.startDate = date
    }
    if (Object.prototype.hasOwnProperty.call(data, "endDate") && data.endDate) {
      const date = new Date(data.endDate)
      if (isNaN(date.getTime())) {
        return badRequestResponse("Geçersiz bitiş tarihi", undefined, request)
      }
      updateData.endDate = date
    }
    
    // Validate date range if both dates are being updated
    if (updateData.startDate && updateData.endDate) {
      const start = updateData.startDate as Date
      const end = updateData.endDate as Date
      if (end < start) {
        return badRequestResponse("Bitiş tarihi başlangıç tarihinden önce olamaz", undefined, request)
      }
    }
    
    if (Object.prototype.hasOwnProperty.call(data, "price")) {
      updateData.price = data.price ?? null
    }
    if (Object.prototype.hasOwnProperty.call(data, "quota")) {
      updateData.quota = data.quota ?? null
    }
    if (Object.prototype.hasOwnProperty.call(data, "isActive") && data.isActive !== undefined) {
      updateData.isActive = Boolean(data.isActive)
    }

    if (Object.keys(updateData).length === 0) {
      return badRequestResponse("Güncellenecek alan bulunamadı", undefined, request)
    }

    try {
      const trip = await prisma.trip.update({
        where: { id: tripId },
        data: updateData,
        include: {
          _count: {
            select: { applications: true },
          },
        },
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
    } catch (dbError) {
      if (
        typeof dbError === "object" &&
        dbError !== null &&
        "code" in dbError &&
        dbError.code === "P2025"
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
      throw dbError
    }
  } catch (error) {
    console.error("Error updating trip:", error)
    return serverErrorResponse(error, request)
  }
}

