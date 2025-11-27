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

    // Convert Decimal to number for JSON serialization
    const tripsWithNumbers = trips.map((trip) => ({
      ...trip,
      price: trip.price ? Number(trip.price) : null,
    }))

    const response = NextResponse.json({ data: tripsWithNumbers })
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
      // Prepare price as Decimal if provided
      let priceValue: Prisma.Decimal | null = null
      const price: number | string | null | undefined = data.price as number | string | null | undefined
      
      if (price !== null && price !== undefined) {
        if (typeof price === "string") {
          const trimmed = price.trim()
          if (trimmed !== "" && trimmed !== "null" && trimmed !== "undefined") {
            const priceNum = Number(trimmed)
            if (!isNaN(priceNum) && priceNum > 0) {
              try {
                priceValue = new Prisma.Decimal(priceNum)
              } catch (decimalError) {
                console.error("Error converting price to Decimal:", decimalError)
                return badRequestResponse("Geçersiz ücret formatı", undefined, request)
              }
            }
          }
        } else if (typeof price === "number") {
          if (!isNaN(price) && price > 0) {
            try {
              priceValue = new Prisma.Decimal(price)
            } catch (decimalError) {
              console.error("Error converting price to Decimal:", decimalError)
              return badRequestResponse("Geçersiz ücret formatı", undefined, request)
            }
          }
        }
      }

      const trip = await prisma.trip.create({
        data: {
          title: data.title.trim(),
          description: data.description ?? null,
          extraNotes: data.extraNotes ?? null,
          location: data.location.trim(),
          startDate,
          endDate,
          price: priceValue,
          quota: data.quota ?? null,
          isActive: data.isActive ?? true,
        },
      })

      // Get application count separately
      const applicationCount = await prisma.tripApplication.count({
        where: { tripId: trip.id },
      })

      // Add _count to trip object
      // Convert Decimal to number for JSON serialization
      const tripWithCount = {
        ...trip,
        price: trip.price ? Number(trip.price) : null,
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
      
      // Check for unique constraint violations
      if (
        typeof dbError === "object" &&
        dbError !== null &&
        "code" in dbError &&
        dbError.code === "P2002"
      ) {
        return badRequestResponse("Bu gezi zaten mevcut", undefined, request)
      }
      
      // Log full error details
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      const errorStack = dbError instanceof Error ? dbError.stack : undefined
      console.error("Full error message:", errorMessage)
      console.error("Error stack:", errorStack)
      
      // Return error with details for debugging (in development)
      if (process.env.NODE_ENV === "development") {
        return badRequestResponse(
          `Gezi oluşturulamadı: ${errorMessage}`,
          { stack: errorStack },
          request
        )
      }
      
      return badRequestResponse("Gezi oluşturulamadı", undefined, request)
    }
  } catch (error) {
    console.error("Error creating trip:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return serverErrorResponse(error, request)
  }
}

