import { NextRequest, NextResponse } from "next/server"
import { geziService } from "@/lib/gezi-service"

type RouteContext = { params: Promise<{ tripId: string }> }

export const runtime = "nodejs"

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "Gezi servisi hatası"
  const status =
    error instanceof Error && "status" in error && typeof error.status === "number"
      ? error.status
      : 500
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tripId } = await context.params
    const response = await geziService.exportTripApplications(
      tripId,
      request.nextUrl.searchParams
    )

    if (!response.ok) {
      const errorText = await response.text()
      const error = new Error(errorText || "Gezi servisi hatası")
      ;(error as Error & { status?: number }).status = response.status
      throw error
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const headers = new Headers()
    headers.set(
      "content-type",
      response.headers.get("content-type") ??
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    const disposition =
      response.headers.get("content-disposition") ??
      'attachment; filename="gezi-basvurular.xlsx"'
    headers.set("content-disposition", disposition)

    return new NextResponse(buffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    return handleError(error)
  }
}

