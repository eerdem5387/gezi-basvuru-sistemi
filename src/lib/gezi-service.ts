const GEZI_SERVICE_URL = process.env.GEZI_SERVICE_URL?.replace(/\/$/, "")
const SERVICE_API_SECRET = process.env.SERVICE_API_SECRET

function ensureConfig() {
  if (!GEZI_SERVICE_URL) {
    throw new Error("GEZI_SERVICE_URL is not configured")
  }
  if (!SERVICE_API_SECRET) {
    throw new Error("SERVICE_API_SECRET is not configured")
  }
}

async function geziFetch(path: string, init: RequestInit = {}) {
  ensureConfig()

  const headers = new Headers(init.headers)
  headers.set("x-service-secret", SERVICE_API_SECRET!)

  return fetch(`${GEZI_SERVICE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Gezi servis isteği başarısız oldu"
    try {
      const data = await response.json()
      message = data?.error || data?.message || message
    } catch {
      message = await response.text()
    }
    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  return response.json() as Promise<T>
}

export const geziService = {
  fetchTrips: async (query: URLSearchParams) => {
    const qs = query.toString()
    const response = await geziFetch(`/api/trips${qs ? `?${qs}` : ""}`)
    return parseJson<{ data: unknown }>(response)
  },

  createTrip: async (payload: unknown) => {
    const response = await geziFetch(`/api/trips`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    return parseJson<{ data: unknown }>(response)
  },

  getTripById: async (tripId: string) => {
    const response = await geziFetch(`/api/trips/${tripId}`)
    return parseJson<{ data: unknown }>(response)
  },

  updateTrip: async (tripId: string, payload: unknown) => {
    const response = await geziFetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    return parseJson<{ data: unknown }>(response)
  },

  fetchTripApplications: async (tripId: string, query: URLSearchParams) => {
    const qs = query.toString()
    const response = await geziFetch(
      `/api/trips/${tripId}/applications${qs ? `?${qs}` : ""}`
    )
    return parseJson<{ data: unknown }>(response)
  },

  exportTripApplications: async (tripId: string, query: URLSearchParams) => {
    const qs = query.toString()
    return geziFetch(
      `/api/trips/${tripId}/applications/export${qs ? `?${qs}` : ""}`
    )
  },

  fetchTripStats: async () => {
    const response = await geziFetch(`/api/trips/stats`)
    return parseJson<{ data: unknown }>(response)
  },
}

