import { NextRequest, NextResponse } from "next/server"
import { geziService } from "@/lib/gezi-service"

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "Gezi servisi hatası"
  const status =
    error instanceof Error && "status" in error && typeof error.status === "number"
      ? error.status
      : 500
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const data = await geziService.fetchTrips(request.nextUrl.searchParams)
    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const data = await geziService.createTrip(payload)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

