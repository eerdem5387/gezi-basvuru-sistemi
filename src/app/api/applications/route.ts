import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { tripApplicationSchema } from "@/lib/validations"
import { badRequestResponse, serverErrorResponse } from "@/lib/http"

export async function POST(request: NextRequest) {
  try {
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

    const parsed = tripApplicationSchema.safeParse(payload)

    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten())
      return badRequestResponse("Başvuru doğrulanamadı", parsed.error.flatten(), request)
    }

    const data = parsed.data

    try {
      const trip = await prisma.trip.findUnique({
        where: { id: data.tripId },
      })

      if (!trip) {
        return badRequestResponse("Gezi bulunamadı", undefined, request)
      }

      if (!trip.isActive) {
        return badRequestResponse("Gezi başvurusu kapalı", undefined, request)
      }

      if (trip.endDate.getTime() < Date.now()) {
        return badRequestResponse("Gezi tarihleri geçmiş, başvuru yapılamaz", undefined, request)
      }

      const existing = await prisma.tripApplication.findFirst({
        where: {
          tripId: data.tripId,
          ogrenciTelefon: data.ogrenciTelefon,
        },
      })

      if (existing) {
        return badRequestResponse("Bu telefon numarası ile zaten başvuru yapılmış", undefined, request)
      }

      const application = await prisma.tripApplication.create({
        data: {
          tripId: data.tripId,
          ogrenciAdSoyad: data.ogrenciAdSoyad.trim(),
          ogrenciSinifi: data.ogrenciSinifi,
          veliAdSoyad: data.veliAdSoyad.trim(),
          veliTelefon: data.veliTelefon,
          ogrenciTelefon: data.ogrenciTelefon,
        },
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            id: application.id,
          },
        },
        { status: 201 }
      )
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Check for unique constraint violations
      if (
        typeof dbError === "object" &&
        dbError !== null &&
        "code" in dbError &&
        dbError.code === "P2002"
      ) {
        return badRequestResponse("Bu telefon numarası ile zaten başvuru yapılmış", undefined, request)
      }
      throw dbError
    }
  } catch (error) {
    console.error("Error creating application:", error)
    return serverErrorResponse(error, request)
  }
}

