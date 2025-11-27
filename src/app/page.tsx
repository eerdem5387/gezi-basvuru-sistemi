export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 text-slate-900">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            Gezi Başvuru Sistemi
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Okul gezileri için modern başvuru deneyimi
          </h1>
        </div>
        <p className="text-lg text-slate-600">
          Bu servis, veliler için güvenli başvuru süreçleri sunarken,
          yönetim paneli tarafında gezileri oluşturma, pasife alma ve gelen
          başvuruları raporlama ihtiyaçlarına özel API&apos;ler sağlar.
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Neler geliştiriliyor?
          </h2>
          <ul className="mt-4 space-y-2 text-slate-600">
            <li>• Yönetim paneli için API tabanlı gezi yönetimi</li>
            <li>• Veliler için sezgisel başvuru formu</li>
            <li>• Excel export ve istatistik servisleri</li>
          </ul>
        </div>
      </section>
    </main>
  )
}

