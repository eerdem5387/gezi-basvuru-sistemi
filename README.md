# 🚌 Gezi Başvuru Sistemi

Okul gezileri için başvuru toplayan, başvuruları raporlayan ve okul yönetim paneliyle headless API üzerinden konuşan Next.js tabanlı servis.

## 🚀 Teknolojiler

- Next.js 16 (App Router)
- React 19 + TypeScript
- Prisma ORM + PostgreSQL (Neon)
- Tailwind CSS
- Zod ile validation
- XLSX export

## 📦 Scriptler

```bash
npm install
npm run dev
npm run build
npm run db:push
npm run db:migrate
```

## 🔐 Servisler Arası Güvenlik

Okul yönetim panelinden gelen tüm yönetim çağrıları `X-Service-Secret` (veya `Authorization: Bearer ...`) başlığı ile doğrulanır. `SERVICE_API_SECRET` her iki projede aynı olmalıdır.

## 🗃️ Prisma Modelleri

- `Trip`: Gezi meta verileri (ek açıklama alanı dahil)
- `TripApplication`: Öğrenci başvuruları

## 🔗 API Yüzeyi

| Endpoint | Açıklama | Auth |
| --- | --- | --- |
| `POST /api/trips` | Gezi oluştur | ✅ |
| `GET /api/trips` | Gezi listesini getir (filtrelenebilir) | ✅ |
| `GET /api/trips/:id` | Gezi detay + başvuru sayısı | ✅ |
| `PATCH /api/trips/:id` | Gezi düzenleme / aktif-pasif | ✅ |
| `GET /api/trips/:id/applications` | Başvuru listesi (pagination) | ✅ |
| `GET /api/trips/:id/applications/export` | Excel export | ✅ |
| `GET /api/trips/stats` | Panel kartları için sayısal veriler | ✅ |
| `GET /api/trips/public` | Aktif gezileri getir (veliler için) | ❌ |
| `POST /api/applications` | Başvuru oluştur (öğrenci & veli bilgileri) | ❌ |

### Başvuru formu alanları
- Öğrenci Ad Soyad (zorunlu)
- Veli Ad Soyad (zorunlu)
- Öğrencinin Sınıfı (5-12 seçenekli)
- Veli Telefonu (5XXXXXXXXX formatı)
- Öğrenci Telefonu (5XXXXXXXXX formatı)

## 📄 Environment Variables

```
DATABASE_URL=postgresql://...
SERVICE_API_SECRET=super-secret
```

## 🧭 Sonraki Adımlar

- Yönetim paneli ile entegrasyon (okul-yonetim-sistemi)
- Public başvuru formu arayüzü
- Queue / retry mekanizmaları (gerektiğinde)

