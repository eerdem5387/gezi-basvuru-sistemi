import { NextResponse } from "next/server"

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export function badRequestResponse(message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status: 400 }
  )
}

export function serverErrorResponse(error: unknown) {
  console.error(error)
  return NextResponse.json(
    {
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 }
  )
}

