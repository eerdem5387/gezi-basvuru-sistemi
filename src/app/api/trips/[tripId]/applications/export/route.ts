import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import { validateServiceRequest } from "@/lib/service-auth"
import { serverErrorResponse, unauthorizedResponse } from "@/lib/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
    })

    if (!trip) {
      return NextResponse.json({ error: "Gezi bulunamadı" }, { status: 404 })
    }

    const applications = await prisma.tripApplication.findMany({
      where: { tripId: params.tripId },
      orderBy: { createdAt: "asc" },
    })

    const rows = applications.map((app) => ({
      "Başvuru ID": app.id,
      "Öğrenci Adı": app.ogrenciAdSoyad,
      "Öğrenci Sınıfı": app.ogrenciSinifi,
      "Veli Adı": app.veliAdSoyad,
      "Veli Telefon": app.veliTelefon,
      "Öğrenci Telefonu": app.ogrenciTelefon,
      Durum: app.status,
      "Başvuru Tarihi": app.createdAt.toISOString(),
    }))

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, worksheet, "Basvurular")

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    const filename = `gezi-${trip.title.replace(/\s+/g, "-").toLowerCase()}-basvurular.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

