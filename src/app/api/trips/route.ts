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
      return unauthorizedResponse(request)
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
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    })

    const response = NextResponse.json({ data: trips })
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

export async function POST(request: NextRequest) {
  try {
    if (!validateServiceRequest(request)) {
      return unauthorizedResponse(request)
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

    const parsed = createTripSchema.safeParse(payload)

    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten())
      return badRequestResponse("Gezi verisi doğrulanamadı", parsed.error.flatten(), request)
    }

    const data = parsed.data

    // Validate dates one more time
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    
    if (isNaN(startDate.getTime())) {
      return badRequestResponse("Geçersiz başlangıç tarihi", undefined, request)
    }
    if (isNaN(endDate.getTime())) {
      return badRequestResponse("Geçersiz bitiş tarihi", undefined, request)
    }
    if (endDate < startDate) {
      return badRequestResponse("Bitiş tarihi başlangıç tarihinden önce olamaz", undefined, request)
    }

    try {
      const trip = await prisma.trip.create({
        data: {
          title: data.title.trim(),
          description: data.description ?? null,
          extraNotes: data.extraNotes ?? null,
          location: data.location.trim(),
          startDate,
          endDate,
          price: data.price !== null && data.price !== undefined ? new Prisma.Decimal(data.price) : null,
          quota: data.quota ?? null,
          isActive: data.isActive ?? true,
        },
      })

      // Get application count separately
      const applicationCount = await prisma.tripApplication.count({
        where: { tripId: trip.id },
      })

      // Add _count to trip object
      const tripWithCount = {
        ...trip,
        _count: {
          applications: applicationCount,
        },
      }

      const response = NextResponse.json({ data: tripWithCount }, { status: 201 })
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
    } catch (dbError) {
      console.error("Database error creating trip:", dbError)
      console.error("Error details:", JSON.stringify(dbError, null, 2))
      // Check for unique constraint violations
      if (
        typeof dbError === "object" &&
        dbError !== null &&
        "code" in dbError &&
        dbError.code === "P2002"
      ) {
        return badRequestResponse("Bu gezi zaten mevcut", undefined, request)
      }
      // Return more detailed error for debugging
      const errorMessage = dbError instanceof Error ? dbError.message : "Veritabanı hatası"
      console.error("Full error:", errorMessage)
      return badRequestResponse(`Gezi oluşturulamadı: ${errorMessage}`, undefined, request)
    }
  } catch (error) {
    console.error("Error creating trip:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return serverErrorResponse(error, request)
  }
}

