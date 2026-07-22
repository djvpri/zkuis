'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Attempt {
  id: string; nama: string; skor: number; total: number; durasi: number | null; createdAt: string
}
interface QuizData {
  id: string; topik: string; kategori: string; jumlah: number; tipe: string; level: string
  soal: unknown[]; publicAttempts: Attempt[]
}

function fmtDurasi(s: number | null) {
  if (!s) return ''
  const m = Math.floor(s / 60), sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function fmtAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

const MEDAL = ['🥇', '🥈', '🥉']

export default function SharePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [quiz, setQuiz]         = useState<QuizData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [nama, setNama]         = useState('')
  const [starting, setStarting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/share/${id}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null } return r.json() })
      .then(d => { if (d) setQuiz(d) })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (showModal) setTimeout(() => inputRef.current?.focus(), 100)
  }, [showModal])

  function handleMulai() {
    if (!nama.trim() || !quiz || starting) return
    setStarting(true)
    const newId = crypto.randomUUID()
    sessionStorage.setItem(`zkuis_${newId}`, JSON.stringify({
      soal: quiz.soal,
      meta: { topik: quiz.topik, kategori: quiz.kategori, jumlah: quiz.jumlah, tipe: quiz.tipe, level: quiz.level },
      fromShared: id,
      namaPlayer: nama.trim(),
      startedAt: Date.now(),
    }))
    router.push(`/quiz/${newId}`)
  }

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 text-center px-4">
      <i className="bi bi-exclamation-circle text-4xl text-slate-500" />
      <p className="font-bold text-xl">Kuis tidak ditemukan</p>
      <p className="text-slate-400 text-sm">Link mungkin sudah tidak aktif atau telah diprivatkan.</p>
      <Link href="/" className="mt-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
        Ke Beranda
      </Link>
    </div>
  )

  const q   = quiz!
  const top = q.publicAttempts
  const skorPct = (skor: number, total: number) => Math.round((skor / total) * 100)
  const skorColor = (pct: number) => pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="min-h-dvh max-w-2xl mx-auto px-4 py-8 pb-32">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
          <i className="bi bi-arrow-left text-sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400 mb-0.5">
            <i className="bi bi-share me-1" /> Kuis Dibagikan
          </p>
          <h1 className="font-bold text-xl leading-tight truncate">{q.topik}</h1>
        </div>
      </div>

      {/* Info badges */}
      <div className="flex flex-wrap gap-2 mb-7">
        {[
          { icon: 'bi-tag', label: q.kategori },
          { icon: 'bi-question-circle', label: `${q.jumlah} soal` },
          { icon: 'bi-bar-chart', label: q.level },
          { icon: 'bi-people', label: top.length === 0 ? 'Belum ada peserta' : `${top.length >= 10 ? '10+' : top.length} peserta` },
        ].map(b => (
          <span key={b.label} className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1.5">
            <i className={`bi ${b.icon}`} /> {b.label}
          </span>
        ))}
      </div>

      {/* CTA */}
      <button onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-base transition-all active:scale-[0.99] glow-violet mb-8 shadow-lg shadow-violet-500/20">
        <i className="bi bi-play-circle-fill text-lg" /> Mulai Kerjakan
      </button>

      {/* Leaderboard */}
      <h2 className="font-bold mb-4 flex items-center gap-2">
        <i className="bi bi-trophy-fill text-amber-400" />
        Papan Skor
        {top.length > 0 && (
          <span className="text-xs text-slate-500 font-normal ml-1">{top.length} terbaik</span>
        )}
      </h2>

      {top.length === 0 ? (
        <div className="text-center py-14 text-slate-500 border border-slate-800 rounded-2xl bg-slate-900/40">
          <i className="bi bi-trophy text-4xl mb-3 block opacity-20" />
          <p className="text-sm font-medium">Belum ada yang mengerjakan</p>
          <p className="text-xs mt-1 opacity-60">Jadilah yang pertama!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {top.map((a, i) => {
            const pct = skorPct(a.skor, a.total)
            return (
              <div key={a.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                i === 0 ? 'bg-amber-500/5 border-amber-500/25' :
                i === 1 ? 'bg-slate-500/5 border-slate-500/25' :
                i === 2 ? 'bg-orange-500/5 border-orange-500/25' :
                'bg-slate-900 border-slate-800'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                  i < 3
                    ? 'text-lg leading-none'
                    : 'bg-slate-800 text-slate-400 text-xs'
                }`}>
                  {i < 3 ? MEDAL[i] : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{a.nama}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fmtAgo(a.createdAt)}
                    {a.durasi ? <> · <i className="bi bi-clock me-0.5" />{fmtDurasi(a.durasi)}</> : ''}
                  </p>
                </div>
                <div className={`font-black text-lg tabular-nums ${skorColor(pct)}`}>
                  {pct}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal input nama */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="w-full max-w-sm bg-[#0d1526] border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-bold text-lg mb-1">Siap Mulai?</h3>
            <p className="text-sm text-slate-400 mb-5">Masukkan namamu untuk papan skor</p>
            <input
              ref={inputRef}
              type="text"
              placeholder="Nama kamu..."
              maxLength={50}
              value={nama}
              onChange={e => setNama(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleMulai() }}
              className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white outline-none mb-4 placeholder:text-slate-600"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button onClick={handleMulai} disabled={!nama.trim() || starting}
                className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold transition-all">
                {starting
                  ? <><i className="bi bi-arrow-repeat animate-spin me-1" /> Memuat...</>
                  : 'Mulai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
