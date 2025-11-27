export default function GeziPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 text-slate-900">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            Gezi Yönetimi
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Gezi Başvuru Sistemi API
          </h1>
        </div>
        <p className="text-lg text-slate-600">
          Bu sistem, okul gezileri için başvuru toplama ve yönetim API&apos;leri sağlar.
          Yönetim paneli için okul-yonetim-sistemi&apos;ni kullanın.
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            API Endpoints
          </h2>
          <ul className="space-y-2 text-slate-600">
            <li>• <code className="bg-slate-100 px-2 py-1 rounded">GET /api/trips</code> - Gezileri listele</li>
            <li>• <code className="bg-slate-100 px-2 py-1 rounded">POST /api/trips</code> - Yeni gezi oluştur</li>
            <li>• <code className="bg-slate-100 px-2 py-1 rounded">GET /api/trips/[id]</code> - Gezi detayı</li>
            <li>• <code className="bg-slate-100 px-2 py-1 rounded">PATCH /api/trips/[id]</code> - Gezi güncelle</li>
            <li>• <code className="bg-slate-100 px-2 py-1 rounded">GET /api/trips/[id]/applications</code> - Başvuruları listele</li>
            <li>• <code className="bg-slate-100 px-2 py-1 rounded">GET /api/trips/[id]/applications/export</code> - Excel export</li>
            <li>• <code className="bg-slate-100 px-2 py-1 rounded">GET /api/trips/stats</code> - İstatistikler</li>
            <li>• <code className="bg-slate-100 px-2 py-1 rounded">GET /api/trips/public</code> - Aktif geziler (public)</li>
            <li>• <code className="bg-slate-100 px-2 py-1 rounded">POST /api/applications</code> - Başvuru oluştur</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            🔒 Güvenlik
          </h2>
          <p className="text-blue-800">
            Tüm yönetim API&apos;leri <code className="bg-blue-100 px-2 py-1 rounded">X-Service-Secret</code> header&apos;ı ile korunmaktadır.
          </p>
        </div>
      </section>
    </main>
  )
}
