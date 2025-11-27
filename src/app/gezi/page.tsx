"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  FileSpreadsheet,
  Loader2,
  MapPin,
  NotebookPen,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react"

interface Trip {
  id: string
  title: string
  description: string | null
  extraNotes: string | null
  location: string
  startDate: string
  endDate: string
  price?: number | null
  quota?: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    applications: number
  }
}

interface TripApplication {
  id: string
  ogrenciAdSoyad: string
  veliAdSoyad: string
  ogrenciSinifi: string
  veliTelefon: string
  ogrenciTelefon: string
  status: string
  createdAt: string
}

interface TripStats {
  totalTrips: number
  activeTrips: number
  upcomingTrips: number
  totalApplications: number
  monthlyApplications: number
}

interface TripFormState {
  id?: string
  title: string
  location: string
  startDate: string
  endDate: string
  price?: string
  quota?: string
  description?: string
  extraNotes?: string
  isActive: boolean
}

const initialFormState: TripFormState = {
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  price: "",
  quota: "",
  description: "",
  extraNotes: "",
  isActive: true,
}

export default function GeziPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [stats, setStats] = useState<TripStats>({
    totalTrips: 0,
    activeTrips: 0,
    upcomingTrips: 0,
    totalApplications: 0,
    monthlyApplications: 0,
  })
  const [loadingTrips, setLoadingTrips] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [applications, setApplications] = useState<TripApplication[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [formState, setFormState] = useState<TripFormState>(initialFormState)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const upcomingTrips = useMemo(() => {
    const now = new Date().getTime()
    return trips.filter((trip) => new Date(trip.startDate).getTime() >= now)
  }, [trips])

  const fetchTrips = useCallback(async () => {
    try {
      setLoadingTrips(true)
      setErrorMessage(null)
      const response = await fetch("/api/gezi/trips")
      if (!response.ok) {
        throw new Error("Gezi listesi alınamadı")
      }
      const data = await response.json()
      setTrips(Array.isArray(data?.data) ? (data.data as Trip[]) : [])
    } catch (error) {
      console.error(error)
      setErrorMessage(
        error instanceof Error ? error.message : "Geziler yüklenirken hata oluştu"
      )
    } finally {
      setLoadingTrips(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true)
      const response = await fetch("/api/gezi/trips/stats")
      if (!response.ok) {
        throw new Error("İstatistikler alınamadı")
      }
      const data = await response.json()
      setStats(
        data?.data ?? {
          totalTrips: 0,
          activeTrips: 0,
          upcomingTrips: 0,
          totalApplications: 0,
          monthlyApplications: 0,
        }
      )
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const fetchTripDetail = useCallback(async (tripId: string) => {
    try {
      const response = await fetch(`/api/gezi/trips/${tripId}`)
      if (!response.ok) {
        throw new Error("Gezi detayı alınamadı")
      }
      const data = await response.json()
      setSelectedTrip(data?.data ?? null)
    } catch (error) {
      console.error(error)
      setSelectedTrip(null)
    }
  }, [])

  const fetchApplications = useCallback(async (tripId: string) => {
    try {
      setApplicationsLoading(true)
      const response = await fetch(
        `/api/gezi/trips/${tripId}/applications?limit=100`
      )
      if (!response.ok) {
        throw new Error("Başvurular alınamadı")
      }
      const data = await response.json()
      setApplications(Array.isArray(data?.data) ? (data.data as TripApplication[]) : [])
    } catch (error) {
      console.error(error)
      setApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrips()
    fetchStats()
  }, [fetchTrips, fetchStats])

  const handleSelectTrip = async (trip: Trip) => {
    setSelectedTrip(trip)
    await fetchTripDetail(trip.id)
    await fetchApplications(trip.id)
  }

  const resetForm = () => {
    setFormState(initialFormState)
    setIsEditing(false)
  }

  const populateForm = (trip: Trip) => {
    setFormState({
      id: trip.id,
      title: trip.title,
      location: trip.location,
      startDate: trip.startDate ? trip.startDate.split("T")[0] : "",
      endDate: trip.endDate ? trip.endDate.split("T")[0] : "",
      price: trip.price ? String(trip.price) : "",
      quota: trip.quota ? String(trip.quota) : "",
      description: trip.description ?? "",
      extraNotes: trip.extraNotes ?? "",
      isActive: trip.isActive,
    })
    setIsEditing(true)
  }

  const mapFormToPayload = (state: TripFormState) => {
    const payload: Record<string, unknown> = {
      title: state.title,
      location: state.location,
      startDate: state.startDate ? new Date(state.startDate).toISOString() : null,
      endDate: state.endDate ? new Date(state.endDate).toISOString() : null,
      description: state.description?.trim() || null,
      extraNotes: state.extraNotes?.trim() || null,
      isActive: state.isActive,
    }

    if (state.price) {
      payload.price = Number(state.price)
    }
    if (state.quota) {
      payload.quota = Number(state.quota)
    }

    return payload
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      setFormSubmitting(true)
      const payload = mapFormToPayload(formState)
      const endpoint = isEditing && formState.id ? `/api/gezi/trips/${formState.id}` : "/api/gezi/trips"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Gezi kaydedilemedi")
      }

      resetForm()
      await fetchTrips()
      await fetchStats()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Gezi kaydedilemedi")
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleToggleTrip = async (trip: Trip) => {
    try {
      const response = await fetch(`/api/gezi/trips/${trip.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ isActive: !trip.isActive }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Durum güncellenemedi")
      }
      await fetchTrips()
      await fetchStats()
      if (selectedTrip?.id === trip.id) {
        await fetchTripDetail(trip.id)
      }
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Durum güncellenemedi")
    }
  }

  const handleExportApplications = async () => {
    if (!selectedTrip) return
    try {
      setExporting(true)
      const response = await fetch(
        `/api/gezi/trips/${selectedTrip.id}/applications/export`
      )
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Excel indirilemedi")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedTrip.title.replace(/\s+/g, "-").toLowerCase()}-basvurular.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Excel indirilemedi")
    } finally {
      setExporting(false)
    }
  }

  const formatDateRange = (trip: Trip) => {
    const start = new Date(trip.startDate).toLocaleDateString("tr-TR")
    const end = new Date(trip.endDate).toLocaleDateString("tr-TR")
    return `${start} - ${end}`
  }

  const formatPhone = (phone: string) => {
    if (phone?.length === 10) {
      return `0${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 8)} ${phone.slice(8)}`
    }
    return phone
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gezi Yönetimi</h1>
          <p className="text-gray-500 mt-1">
            Gezileri oluşturun, güncelleyin ve başvuruları tek panelden yönetin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchTrips(); fetchStats() }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={resetForm}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Gezi
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gezi</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalTrips}
            </div>
            <p className="text-xs text-muted-foreground">Planlanan toplam gezi sayısı</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Geziler</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeTrips}
            </div>
            <p className="text-xs text-muted-foreground">Başvuruya açık geziler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yaklaşan Geziler</CardTitle>
            <MapPin className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats.upcomingTrips ?? upcomingTrips.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">Tarihi yaklaşan geziler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başvurular (Ay)</CardTitle>
            <NotebookPen className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats.monthlyApplications
              )}
            </div>
            <p className="text-xs text-muted-foreground">Bu ay alınan başvurular</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gezi Listesi</CardTitle>
              <CardDescription>
                Aktif ve geçmiş gezileri görüntüleyin, durumlarını yönetin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {errorMessage}
                </div>
              )}
              {loadingTrips ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-gray-500">
                        <th className="px-4 py-3">Gezi</th>
                        <th className="px-4 py-3">Tarih</th>
                        <th className="px-4 py-3">Durum</th>
                        <th className="px-4 py-3">Kontenjan</th>
                        <th className="px-4 py-3 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                            Henüz gezi bulunmuyor. Sağdaki formdan yeni gezi ekleyebilirsiniz.
                          </td>
                        </tr>
                      )}
                      {trips.map((trip) => (
                        <tr
                          key={trip.id}
                          className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{trip.title}</div>
                            <div className="text-xs text-gray-500">{trip.location}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDateRange(trip)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                trip.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {trip.isActive ? "Aktif" : "Pasif"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {trip.quota ? `${trip.quota} kişi` : "Belirtilmedi"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectTrip(trip)}
                              >
                                Detay
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => populateForm(trip)}
                              >
                                Düzenle
                              </Button>
                              <Button
                                variant={trip.isActive ? "secondary" : "default"}
                                size="sm"
                                onClick={() => handleToggleTrip(trip)}
                              >
                                {trip.isActive ? "Pasifleştir" : "Aktifleştir"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTrip && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedTrip.title}</CardTitle>
                  <CardDescription>{selectedTrip.location}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exporting || applications.length === 0}
                  onClick={handleExportApplications}
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Excel
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Tarih</p>
                    <p className="font-medium">{formatDateRange(selectedTrip)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Kontenjan</p>
                    <p className="font-medium">
                      {selectedTrip.quota ? `${selectedTrip.quota} kişi` : "Belirtilmedi"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Durum</p>
                    <p className="font-medium">
                      {selectedTrip.isActive ? "Aktif" : "Pasif"}
                    </p>
                  </div>
                </div>

                {(selectedTrip.description || selectedTrip.extraNotes) && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedTrip.description && (
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          Gezi Açıklaması
                        </p>
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                          {selectedTrip.description}
                        </p>
                      </div>
                    )}
                    {selectedTrip.extraNotes && (
                      <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                        <p className="text-xs font-semibold text-blue-600 uppercase">
                          Veli Ek Notu
                        </p>
                        <p className="mt-2 text-sm text-blue-900 whitespace-pre-line">
                          {selectedTrip.extraNotes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Başvurular</h3>
                    {applicationsLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                  </div>
                  {applications.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Bu gezi için henüz başvuru bulunmuyor.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {applications.map((application) => (
                        <div
                          key={application.id}
                          className="rounded-xl border border-gray-100 p-4 hover:border-blue-100"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {application.ogrenciAdSoyad}
                              </p>
                              <p className="text-sm text-gray-500">
                                Veli: {application.veliAdSoyad} • Sınıf:{" "}
                                {application.ogrenciSinifi}
                              </p>
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(application.createdAt).toLocaleDateString("tr-TR")}
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                            <p>Veli Telefon: {formatPhone(application.veliTelefon)}</p>
                            <p>Öğrenci Telefonu: {formatPhone(application.ogrenciTelefon)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Geziyi Güncelle" : "Yeni Gezi Oluştur"}</CardTitle>
              <CardDescription>
                Velilere gösterilecek bilgileri doldurun. Ek açıklamalar veli panelinde görünür.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleFormSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="title">Gezi Adı</Label>
                  <Input
                    id="title"
                    placeholder="Örn: İstanbul Kültür Gezisi"
                    value={formState.title}
                    onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Konum</Label>
                  <Input
                    id="location"
                    placeholder="Örn: İstanbul"
                    value={formState.location}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, location: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Başlangıç Tarihi</Label>
                    <Input
                      type="date"
                      value={formState.startDate}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bitiş Tarihi</Label>
                    <Input
                      type="date"
                      value={formState.endDate}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fiyat (opsiyonel)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Örn: 1500"
                      value={formState.price}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, price: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kontenjan (opsiyonel)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Örn: 40"
                      value={formState.quota}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, quota: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Gezi Açıklaması</Label>
                  <textarea
                    id="description"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                    value={formState.description}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extraNotes">Veli Ek Açıklaması</Label>
                  <textarea
                    id="extraNotes"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                    value={formState.extraNotes}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, extraNotes: e.target.value }))
                    }
                    placeholder="Veliye özel notlar, sağlık bilgileri vb."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    checked={formState.isActive}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                  />
                  <Label htmlFor="isActive">Gezi başvurulara açık olsun</Label>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={formSubmitting} className="flex-1">
                    {formSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isEditing ? (
                      "Geziyi Güncelle"
                    ) : (
                      "Gezi Oluştur"
                    )}
                  </Button>
                  {isEditing && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      İptal
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

