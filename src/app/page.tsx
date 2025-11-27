"use client"

import { useState, useEffect } from "react"

interface Trip {
  id: string
  title: string
  description: string | null
  extraNotes: string | null
  location: string
  startDate: string
  endDate: string
  price: number | null
  quota: number | null
  isActive: boolean
}

interface Student {
  id: string
  fullName: string
  grade: string
  tcNumber: string
}

export default function HomePage() {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentList, setShowStudentList] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    ogrenciAdSoyad: "",
    veliAdSoyad: "",
    ogrenciSinifi: "",
    veliTelefon: "",
    ogrenciTelefon: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [studentSearchError, setStudentSearchError] = useState(false)

  useEffect(() => {
    fetchActiveTrip()
  }, [])

  useEffect(() => {
    // TC numarası 11 haneli olmalı
    const cleanedTc = searchTerm.replace(/\D/g, "") // Sadece rakamları al
    if (cleanedTc.length === 11) {
      const timeoutId = setTimeout(() => {
        fetchStudents(cleanedTc)
      }, 500) // TC numarası tamamlandıktan sonra biraz bekle
      return () => clearTimeout(timeoutId)
    } else {
      setStudents([])
      setStudentSearchError(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const fetchActiveTrip = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/trips/public")
      if (!response.ok) {
        throw new Error("Geziler alınamadı")
      }
      const result = await response.json()
      const trips = result.data || []
      // İlk aktif geziyi al
      if (trips.length > 0) {
        setActiveTrip(trips[0])
      }
    } catch (error) {
      console.error("Error fetching active trip:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async (tcNumber: string) => {
    try {
      // TC numarası validasyonu
      if (!tcNumber || tcNumber.length !== 11 || !/^\d{11}$/.test(tcNumber)) {
        setStudents([])
        return
      }

      // Try multiple API URLs as fallback
      const apiUrls = [
        process.env.NEXT_PUBLIC_YONETIM_API_URL,
        "https://yonetim.leventokullari.com",
        "https://okul-yonetim-sistemi.vercel.app",
      ].filter(Boolean) as string[]

      let lastError: Error | null = null
      
      for (const apiUrl of apiUrls) {
        try {
          // Create abort controller for timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
          
          const response = await fetch(
            `${apiUrl}/api/students/public?tcNumber=${encodeURIComponent(tcNumber)}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              signal: controller.signal,
            }
          )
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const result = await response.json()
          setStudents(result.data || [])
          setStudentSearchError(false) // Clear error on success
          return // Success, exit early
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))
          // Only log non-abort errors
          if (err instanceof Error && err.name !== "AbortError") {
            console.warn(`Failed to fetch from ${apiUrl}:`, lastError.message)
          }
          // Continue to next URL
          continue
        }
      }
      
      // All URLs failed
      setStudents([])
      setStudentSearchError(true)
    } catch (error) {
      console.error("Error fetching students:", error)
      setStudents([])
      setStudentSearchError(true)
    }
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
    // Extract grade number from grade string (e.g., "5. Sınıf" -> "5")
    const gradeMatch = student.grade.match(/\d+/)
    const gradeNumber = gradeMatch ? gradeMatch[0] : ""
    
    setFormData({
      ...formData,
      ogrenciAdSoyad: student.fullName,
      ogrenciSinifi: gradeNumber,
    })
    setSearchTerm("")
    setStudents([])
    setShowStudentList(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess(false)

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.ogrenciAdSoyad.trim()) {
      newErrors.ogrenciAdSoyad = "Öğrenci adı soyadı zorunludur"
    }
    if (!formData.veliAdSoyad.trim()) {
      newErrors.veliAdSoyad = "Veli adı soyadı zorunludur"
    }
    if (!formData.ogrenciSinifi) {
      newErrors.ogrenciSinifi = "Öğrenci sınıfı zorunludur"
    }
    if (!formData.veliTelefon || !formData.veliTelefon.match(/^5\d{9}$/)) {
      newErrors.veliTelefon = "Veli telefonu 10 haneli olmalıdır (5 ile başlamalı)"
    }
    if (!formData.ogrenciTelefon || !formData.ogrenciTelefon.match(/^5\d{9}$/)) {
      newErrors.ogrenciTelefon = "Öğrenci telefonu 10 haneli olmalıdır (5 ile başlamalı)"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (!activeTrip) {
      setErrors({ submit: "Aktif gezi bulunamadı" })
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId: activeTrip.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Başvuru gönderilemedi")
      }

      setSuccess(true)
      setFormData({
        ogrenciAdSoyad: "",
        veliAdSoyad: "",
        ogrenciSinifi: "",
        veliTelefon: "",
        ogrenciTelefon: "",
      })
      setSelectedStudent(null)
    } catch (error) {
      console.error("Error submitting application:", error)
      setErrors({
        submit: error instanceof Error ? error.message : "Başvuru gönderilemedi",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Yükleniyor...</p>
        </div>
      </main>
    )
  }

  if (!activeTrip) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 text-slate-900">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-slate-900 mb-4">
              Gezi Başvuru Sistemi
            </h1>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-lg text-slate-700 leading-relaxed">
                Şu anda düzenlenmiş bir gezi bulunmamaktadır. Planlanmış gezi olup olmadığına
                dair bilgiye ulaşmak için okulumuzla iletişime geçebilirsiniz.
              </p>
              <p className="mt-4 text-xl font-semibold text-slate-900">Levent Kolej</p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 text-slate-900">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">{activeTrip.title}</h1>
          <p className="text-lg text-slate-600">{activeTrip.location}</p>
          <p className="text-sm text-slate-500 mt-2">
            {new Date(activeTrip.startDate).toLocaleDateString("tr-TR")} -{" "}
            {new Date(activeTrip.endDate).toLocaleDateString("tr-TR")}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {activeTrip.price !== null && activeTrip.price > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm font-medium text-green-700">Ücret:</span>
                <span className="text-lg font-semibold text-green-900">
                  {Number(activeTrip.price).toLocaleString("tr-TR")} ₺
                </span>
              </div>
            )}
            {activeTrip.quota !== null && activeTrip.quota > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-700">Kota:</span>
                <span className="text-lg font-semibold text-blue-900">{activeTrip.quota} kişi</span>
              </div>
            )}
          </div>
        </div>

        {activeTrip.description && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Gezi Hakkında</h2>
            <p className="text-slate-700 whitespace-pre-line">{activeTrip.description}</p>
          </div>
        )}

        {activeTrip.extraNotes && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">Önemli Notlar</h2>
            <p className="text-blue-800 whitespace-pre-line">{activeTrip.extraNotes}</p>
          </div>
        )}

        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
            <h2 className="text-xl font-semibold text-green-900 mb-2">Başvuru Başarılı!</h2>
            <p className="text-green-800">
              Gezi başvurunuz başarıyla alınmıştır. En kısa sürede size dönüş yapılacaktır.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Gezi Başvuru Formu</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Öğrenci Seçimi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Öğrenci Seçimi
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Öğrenci TC kimlik numarası ile arayarak listeden seçebilirsiniz. KVKK gereği sadece TC numarası ile arama yapılabilir. Seçmezseniz manuel olarak girebilirsiniz.
                </p>
                {studentSearchError && searchTerm.replace(/\D/g, "").length === 11 && (
                  <p className="text-xs text-amber-600 mb-2">
                    ⚠️ Bu TC numarası ile kayıtlı öğrenci bulunamadı. Lütfen bilgileri manuel olarak giriniz.
                  </p>
                )}
                {searchTerm && searchTerm.replace(/\D/g, "").length > 0 && searchTerm.replace(/\D/g, "").length !== 11 && (
                  <p className="text-xs text-amber-600 mb-2">
                    ⚠️ TC kimlik numarası 11 haneli olmalıdır.
                  </p>
                )}
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="TC Kimlik Numarası (11 haneli)"
                    value={searchTerm}
                    maxLength={11}
                    onChange={(e) => {
                      // Sadece rakamları kabul et
                      const value = e.target.value.replace(/\D/g, "")
                      setSearchTerm(value)
                      if (value.length === 11) {
                        setShowStudentList(true)
                      } else {
                        setShowStudentList(false)
                        setStudents([])
                        if (!value) {
                          setSelectedStudent(null)
                          setFormData((prev) => ({ ...prev, ogrenciAdSoyad: "", ogrenciSinifi: "" }))
                        }
                      }
                    }}
                    onFocus={() => {
                      if (searchTerm.replace(/\D/g, "").length === 11) {
                        setShowStudentList(true)
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click event to fire
                      setTimeout(() => setShowStudentList(false), 200)
                    }}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  {showStudentList && students.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {students.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleStudentSelect(student)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                        >
                          <div className="font-medium text-slate-900">{student.fullName}</div>
                          <div className="text-sm text-slate-500">{student.grade}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showStudentList && searchTerm.replace(/\D/g, "").length === 11 && students.length === 0 && !studentSearchError && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center">
                      <p className="text-sm text-slate-500">Aranıyor...</p>
                    </div>
                  )}
                  {showStudentList && searchTerm.replace(/\D/g, "").length === 11 && students.length === 0 && studentSearchError && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center">
                      <p className="text-sm text-amber-600">Bu TC numarası ile kayıtlı öğrenci bulunamadı</p>
                    </div>
                  )}
                </div>
                {selectedStudent && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Seçili:</span> {selectedStudent.fullName} ({selectedStudent.grade})
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null)
                        setFormData((prev) => ({ ...prev, ogrenciAdSoyad: "", ogrenciSinifi: "" }))
                        setSearchTerm("")
                      }}
                      className="mt-1 text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Seçimi kaldır
                    </button>
                  </div>
                )}
              </div>

              {/* Öğrenci Adı Soyadı */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Öğrenci Adı Soyadı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ogrenciAdSoyad}
                  onChange={(e) =>
                    setFormData({ ...formData, ogrenciAdSoyad: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {errors.ogrenciAdSoyad && (
                  <p className="mt-1 text-sm text-red-600">{errors.ogrenciAdSoyad}</p>
                )}
              </div>

              {/* Öğrenci Sınıfı */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Öğrenci Sınıfı <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.ogrenciSinifi}
                  onChange={(e) =>
                    setFormData({ ...formData, ogrenciSinifi: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Sınıf Seçiniz</option>
                  <option value="5">5. Sınıf</option>
                  <option value="6">6. Sınıf</option>
                  <option value="7">7. Sınıf</option>
                  <option value="8">8. Sınıf</option>
                  <option value="9">9. Sınıf</option>
                  <option value="10">10. Sınıf</option>
                  <option value="11">11. Sınıf</option>
                  <option value="12">12. Sınıf</option>
                </select>
                {errors.ogrenciSinifi && (
                  <p className="mt-1 text-sm text-red-600">{errors.ogrenciSinifi}</p>
                )}
              </div>

              {/* Veli Adı Soyadı */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Veli Adı Soyadı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.veliAdSoyad}
                  onChange={(e) =>
                    setFormData({ ...formData, veliAdSoyad: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {errors.veliAdSoyad && (
                  <p className="mt-1 text-sm text-red-600">{errors.veliAdSoyad}</p>
                )}
              </div>

              {/* Veli Telefon */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Veli Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="5XXXXXXXXX"
                  value={formData.veliTelefon}
                  onChange={(e) =>
                    setFormData({ ...formData, veliTelefon: e.target.value.replace(/\D/g, "") })
                  }
                  maxLength={10}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {errors.veliTelefon && (
                  <p className="mt-1 text-sm text-red-600">{errors.veliTelefon}</p>
                )}
              </div>

              {/* Öğrenci Telefon */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Öğrenci Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="5XXXXXXXXX"
                  value={formData.ogrenciTelefon}
                  onChange={(e) =>
                    setFormData({ ...formData, ogrenciTelefon: e.target.value.replace(/\D/g, "") })
                  }
                  maxLength={10}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {errors.ogrenciTelefon && (
                  <p className="mt-1 text-sm text-red-600">{errors.ogrenciTelefon}</p>
                )}
              </div>

              {errors.submit && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  )
}
