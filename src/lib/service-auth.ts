const SERVICE_SECRET_HEADER = "x-service-secret"

type SupportedRequest = Request | import("next/server").NextRequest

export function validateServiceRequest(request: SupportedRequest) {
  const expectedSecret = process.env.SERVICE_API_SECRET
  if (!expectedSecret) {
    console.error("SERVICE_API_SECRET is not configured")
    return false
  }

  // HTTP headers are case-insensitive, but we check both lowercase and original case
  const secret =
    request.headers.get(SERVICE_SECRET_HEADER) ??
    request.headers.get("X-Service-Secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "")

  if (!secret) {
    console.error("Service secret header not found in request")
    return false
  }

  if (secret !== expectedSecret) {
    console.error("Service secret mismatch")
    return false
  }

  return true
}

