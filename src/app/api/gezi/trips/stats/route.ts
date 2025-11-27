import { NextResponse } from "next/server"
import { geziService } from "@/lib/gezi-service"

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "Gezi servisi hatası"
  const status =
    error instanceof Error && "status" in error && typeof error.status === "number"
      ? error.status
      : 500
  return NextResponse.json({ error: message }, { status })
}

export async function GET() {
  try {
    const data = await geziService.fetchTripStats()
    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

