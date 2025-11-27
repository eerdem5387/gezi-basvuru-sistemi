import { z } from "zod"

const numericString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Geçerli bir sayı giriniz")
  .transform((val) => Number(val))

const optionalNumeric = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .nullable()
  .transform((value) => {
    if (value === undefined || value === null || value === "") {
      return null
    }
    if (typeof value === "number") {
      return isNaN(value) ? null : value
    }
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed === "" || trimmed === "null" || trimmed === "undefined") {
        return null
      }
      const num = Number(trimmed)
      return isNaN(num) ? null : num
    }
    return null
  })

const optionalInteger = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .nullable()
  .transform((value) => {
    if (value === undefined || value === null || value === "") {
      return null
    }
    if (typeof value === "number") {
      return isNaN(value) ? null : Math.floor(value)
    }
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed === "" || trimmed === "null" || trimmed === "undefined") {
        return null
      }
      const num = Number(trimmed)
      return isNaN(num) ? null : Math.floor(num)
    }
    return null
  })

const dateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Geçerli bir tarih giriniz",
  })

export const tripBaseSchema = z
  .object({
    title: z.string().min(3, "Gezi adı en az 3 karakter olmalıdır"),
    description: z.string().max(2000).optional().nullable(),
    extraNotes: z.string().max(2000).optional().nullable(),
    location: z.string().min(2, "Konum bilgisi zorunludur"),
    startDate: dateString,
    endDate: dateString,
    price: optionalNumeric,
    quota: optionalInteger,
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => new Date(data.endDate).getTime() >= new Date(data.startDate).getTime(),
    {
      message: "Bitiş tarihi başlangıç tarihinden önce olamaz",
      path: ["endDate"],
    }
  )

export const createTripSchema = tripBaseSchema
export const updateTripSchema = tripBaseSchema.partial()

const allowedGrades = ["5", "6", "7", "8", "9", "10", "11", "12"] as const

export const tripApplicationSchema = z.object({
  tripId: z.string().min(1),
  ogrenciAdSoyad: z.string().min(3),
  veliAdSoyad: z.string().min(3),
  ogrenciSinifi: z.enum(allowedGrades),
  veliTelefon: z.string().regex(/^5\d{9}$/, "Telefon 10 haneli olmalıdır"),
  ogrenciTelefon: z.string().regex(/^5\d{9}$/, "Telefon 10 haneli olmalıdır"),
})

export type AllowedGrade = (typeof allowedGrades)[number]

