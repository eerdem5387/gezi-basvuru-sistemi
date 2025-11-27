import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateServiceRequest } from "@/lib/service-auth"
import { serverErrorResponse, unauthorizedResponse } from "@/lib/http"

type RouteContext = { params: Promise<{ tripId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (!validateServiceRequest(request)) {
      return unauthorizedResponse(request)
    }

    const { tripId } = await context.params
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get("page") ?? "1")
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100)
    const skip = (page - 1) * limit
    const search = searchParams.get("q")

    const where: Prisma.TripApplicationWhereInput = { tripId }

    if (search) {
      where.OR = [
        { ogrenciAdSoyad: { contains: search, mode: "insensitive" } },
        { veliAdSoyad: { contains: search, mode: "insensitive" } },
        { ogrenciTelefon: { contains: search } },
        { veliTelefon: { contains: search } },
      ]
    }

    const [applications, total] = await Promise.all([
      prisma.tripApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.tripApplication.count({ where }),
    ])

    const response = NextResponse.json({
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }
    return response
  } catch (error) {
    return serverErrorResponse(error, request)
  }
}

