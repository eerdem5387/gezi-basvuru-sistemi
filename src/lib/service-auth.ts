const SERVICE_SECRET_HEADER = "x-service-secret"

type SupportedRequest = Request | import("next/server").NextRequest

export function validateServiceRequest(request: SupportedRequest) {
  const expectedSecret = process.env.SERVICE_API_SECRET
  if (!expectedSecret) {
    throw new Error("SERVICE_API_SECRET is not configured")
  }

  const secret =
    request.headers.get(SERVICE_SECRET_HEADER) ??
    request.headers.get("authorization")?.replace("Bearer ", "")

  if (secret !== expectedSecret) {
    return false
  }

  return true
}

