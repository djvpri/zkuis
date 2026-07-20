import Link from 'next/link'

const features = [
  { icon: 'bi-cpu', title: 'AI Generate Soal', desc: 'Gemini AI buat soal dari topik apapun — matematika, sejarah, CPNS, hingga coding.' },
  { icon: 'bi-file-earmark-text', title: 'Dari Materi Sendiri', desc: 'Paste catatan atau teks dari buku, AI langsung buat soal dari konten kamu.' },
  { icon: 'bi-chat-dots', title: 'Tanya "Kenapa?"', desc: 'Jawaban salah? Klik "Kenapa?" dan AI jelasin dengan bahasa yang mudah dimengerti.' },
  { icon: 'bi-file-pdf', title: 'Export PDF', desc: 'Unduh soal sebagai PDF siap cetak — ada versi soal dan versi kunci jawaban.' },
]

const categories = [
  { icon: 'bi-mortarboard', label: 'SMA / SMP', color: 'from-blue-500 to-indigo-600' },
  { icon: 'bi-building', label: 'Perguruan Tinggi', color: 'from-violet-500 to-purple-600' },
  { icon: 'bi-briefcase', label: 'CPNS / Sertifikasi', color: 'from-amber-500 to-orange-600' },
  { icon: 'bi-globe', label: 'Umum / Trivia', color: 'from-emerald-500 to-teal-600' },
  { icon: 'bi-code-slash', label: 'IT & Coding', color: 'from-cyan-500 to-blue-600' },
  { icon: 'bi-heart-pulse', label: 'Kesehatan & Sains', color: 'from-rose-500 to-pink-600' },
]

const steps = [
  { n: '1', title: 'Pilih Mode', desc: 'Generate dari topik atau paste materi sendiri' },
  { n: '2', title: 'AI Buat Soal', desc: 'Gemini generate soal + pilihan jawaban + pembahasan' },
  { n: '3', title: 'Latihan & Belajar', desc: 'Jawab soal, lihat skor, tanya AI jika tidak mengerti' },
]

export default function HomePage() {
  return (
    <div className="min-h-dvh">

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <i className="bi bi-lightning-charge-fill text-white text-sm" />
            </div>
            <span className="font-bold text-lg tracking-tight">ZKuis</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="https://zone.zomet.my.id" target="_blank"
              className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
              ZOne SSO
            </Link>
            <Link href="/generate"
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95">
              Mulai Latihan
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-5 text-center relative overflow-hidden">
        {/* BG blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[100px]" />
          <div className="absolute top-20 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-300 text-sm font-medium mb-6">
            <i className="bi bi-stars" /> Didukung Gemini AI
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Bank Soal AI<br />
            <span className="gradient-text">Tak Pernah Kehabisan</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Generate ribuan soal dari topik apapun — atau dari materi kamu sendiri.
            Latihan pintar dengan pembahasan AI yang interaktif.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/generate"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all active:scale-95 glow-violet">
              <i className="bi bi-lightning-charge-fill" /> Generate Soal Sekarang
            </Link>
            <Link href="/generate?mode=materi"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all active:scale-95">
              <i className="bi bi-file-earmark-text" /> Dari Materi Saya
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[['∞', 'Topik'], ['AI', 'Pembahasan'], ['PDF', 'Export']].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-violet-400">{val}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kategori */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">Semua Kategori</h2>
        <p className="text-slate-400 text-center text-sm mb-8">Dari ujian sekolah hingga sertifikasi profesional</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map(cat => (
            <Link key={cat.label} href={`/generate?kategori=${encodeURIComponent(cat.label)}`}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <i className={`bi ${cat.icon} text-white text-xl`} />
              </div>
              <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Fitur */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">Kenapa ZKuis Beda?</h2>
        <p className="text-slate-400 text-center text-sm mb-10">Bukan sekadar soal statis — ini pengalaman belajar yang hidup</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/40 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                <i className={`bi ${f.icon} text-violet-400 text-xl`} />
              </div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cara Pakai */}
      <section className="max-w-4xl mx-auto px-5 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Cara Pakai — 3 Langkah</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-6 left-[60%] w-[40%] h-px bg-gradient-to-r from-violet-500/50 to-transparent" />
              )}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 glow-violet">
                {s.n}
              </div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-4xl mx-auto px-5 py-10 pb-24">
        <div className="relative rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 p-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl font-black mb-3">Siap Latihan?</h2>
            <p className="text-slate-400 mb-7 text-sm">Generate soal pertamamu dalam 10 detik — gratis, tanpa daftar.</p>
            <Link href="/generate"
              className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-3.5 rounded-2xl hover:bg-slate-100 transition-all active:scale-95">
              <i className="bi bi-lightning-charge-fill text-violet-600" /> Mulai Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        <p>ZKuis · Bagian dari <a href="https://zone.zomet.my.id" className="text-slate-500 hover:text-slate-400">Ekosistem Zomet</a></p>
        <p className="mt-1">© {new Date().getFullYear()} PT Zomet Teknologi Indonesia</p>
      </footer>

    </div>
  )
}
