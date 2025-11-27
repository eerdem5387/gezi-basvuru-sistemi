import { NextRequest, NextResponse } from "next/server"
import { geziService } from "@/lib/gezi-service"

type RouteContext = { params: Promise<{ tripId: string }> }

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "Gezi servisi hatası"
  const status =
    error instanceof Error && "status" in error && typeof error.status === "number"
      ? error.status
      : 500
  return NextResponse.json({ error: message }, { status })
}

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const { tripId } = await context.params
    const data = await geziService.getTripById(tripId)
    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { tripId } = await context.params
    const payload = await request.json()
    const data = await geziService.updateTrip(tripId, payload)
    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

