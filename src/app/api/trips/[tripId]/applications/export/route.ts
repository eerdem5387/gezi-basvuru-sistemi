import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import { validateServiceRequest } from "@/lib/service-auth"
import { serverErrorResponse, unauthorizedResponse } from "@/lib/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ tripId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (!validateServiceRequest(request)) {
      return unauthorizedResponse(request)
    }

    const { tripId } = await context.params
    
    if (!tripId || typeof tripId !== "string") {
      return badRequestResponse("Geçersiz gezi ID", undefined, request)
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
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

    try {
      const applications = await prisma.tripApplication.findMany({
        where: { tripId },
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
      
      if (!buffer || buffer.length === 0) {
        throw new Error("Excel dosyası oluşturulamadı")
      }
      
      const filename = `gezi-${trip.title.replace(/\s+/g, "-").toLowerCase()}-basvurular.xlsx`

      const origin = request.headers.get("origin")
      const allowedOrigins = [
        "https://okul-yonetim-sistemi.vercel.app",
        "https://yonetim.leventokullari.com",
        "http://localhost:3000",
        "http://localhost:3001",
      ]

      const headers: Record<string, string> = {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      }

      if (origin && allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
      }

      return new NextResponse(buffer, {
        status: 200,
        headers,
      })
    } catch (xlsxError) {
      console.error("Excel generation error:", xlsxError)
      throw xlsxError
    }
  } catch (error) {
    console.error("Error exporting applications:", error)
    return serverErrorResponse(error, request)
  }
}

