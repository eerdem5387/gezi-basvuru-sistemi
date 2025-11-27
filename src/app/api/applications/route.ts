import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { tripApplicationSchema } from "@/lib/validations"
import { badRequestResponse, serverErrorResponse } from "@/lib/http"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const parsed = tripApplicationSchema.safeParse(payload)

    if (!parsed.success) {
      return badRequestResponse("Başvuru doğrulanamadı", parsed.error.flatten())
    }

    const data = parsed.data

    const trip = await prisma.trip.findUnique({
      where: { id: data.tripId },
    })

    if (!trip || !trip.isActive) {
      return badRequestResponse("Gezi başvurusu kapalı veya gezi bulunamadı")
    }

    if (trip.endDate.getTime() < Date.now()) {
      return badRequestResponse("Gezi tarihleri geçmiş, başvuru yapılamaz")
    }

    const existing = await prisma.tripApplication.findFirst({
      where: {
        tripId: data.tripId,
        ogrenciTelefon: data.ogrenciTelefon,
      },
    })

    if (existing) {
      return badRequestResponse("Bu telefon numarası ile zaten başvuru yapılmış")
    }

    const application = await prisma.tripApplication.create({
      data: {
        tripId: data.tripId,
        ogrenciAdSoyad: data.ogrenciAdSoyad,
        ogrenciSinifi: data.ogrenciSinifi,
        veliAdSoyad: data.veliAdSoyad,
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
  } catch (error) {
    return serverErrorResponse(error)
  }
}

