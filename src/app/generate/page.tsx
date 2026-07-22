'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

type Mode = 'topik' | 'materi'
type Tipe = 'pilihan_ganda' | 'essay' | 'campuran'
type Level = 'mudah' | 'sedang' | 'sulit'

const KATEGORI = ['SMA / SMP', 'Perguruan Tinggi', 'CPNS / Sertifikasi', 'Umum / Trivia', 'IT & Coding', 'Kesehatan & Sains']
const JUMLAH   = [5, 10, 15, 20]

function GenerateForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode]         = useState<Mode>((searchParams.get('mode') as Mode) || 'topik')
  const [topik, setTopik]       = useState('')
  const [materi, setMateri]     = useState('')
  const [kategori, setKategori] = useState(searchParams.get('kategori') || KATEGORI[0])
  const [jumlah, setJumlah]     = useState(10)
  const [tipe, setTipe]         = useState<Tipe>('pilihan_ganda')
  const [level, setLevel]       = useState<Level>('sedang')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Gate: wajib login SSO Zomet untuk memakai generator (lindungi kuota AI).
  useEffect(() => {
    fetch('/api/auth/me').then((r) => { if (r.status === 401) router.replace('/login') }).catch(() => {})
  }, [router])

  const canSubmit = mode === 'topik' ? topik.trim().length >= 3 : materi.trim().length >= 50

  async function handleGenerate() {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, topik: topik.trim(), materi: materi.trim(), kategori, jumlah, tipe, level }),
      })
      if (res.status === 401) { router.replace('/login'); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal generate soal')

      const id = crypto.randomUUID()
      sessionStorage.setItem(`zkuis_${id}`, JSON.stringify({ soal: data.soal, meta: { topik: topik || 'Dari Materi', kategori, jumlah, tipe, level } }))
      router.push(`/quiz/${id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menghubungi AI')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh px-4 py-8 pb-16">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
            <i className="bi bi-arrow-left text-sm" />
          </Link>
          <div>
            <h1 className="font-bold text-xl">Generate Soal</h1>
            <p className="text-xs text-slate-400">Didukung Gemini AI</p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-2xl mb-6">
          {([['topik','bi-search','Dari Topik'],['materi','bi-file-earmark-text','Dari Materi']] as const).map(([m,ic,lb]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all ${
                mode === m ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}>
              <i className={`bi ${ic}`} /> {lb}
            </button>
          ))}
        </div>

        <div className="space-y-4">

          {/* Input utama */}
          {mode === 'topik' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Topik Soal *</label>
              <input
                value={topik} onChange={e => setTopik(e.target.value)}
                placeholder="Contoh: Fotosintesis, Pancasila, Algoritma Sorting..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-colors"
              />
              <p className="text-xs text-slate-600 mt-1.5">Minimal 3 karakter</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Paste Materi Kamu *</label>
              <textarea
                value={materi} onChange={e => setMateri(e.target.value)} rows={7}
                placeholder="Tempel teks dari buku, catatan, slide, atau artikel di sini. Gemini akan membuat soal dari konten ini..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors resize-none"
              />
              <p className={`text-xs mt-1.5 ${materi.length < 50 ? 'text-slate-600' : 'text-emerald-500'}`}>
                {materi.length} karakter {materi.length < 50 ? '(minimal 50)' : '✓'}
              </p>
            </div>
          )}

          {/* Kategori — hanya untuk mode topik */}
          {mode === 'topik' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Kategori</label>
              <div className="grid grid-cols-2 gap-2">
                {KATEGORI.map(k => (
                  <button key={k} onClick={() => setKategori(k)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all text-left ${
                      kategori === k
                        ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Jumlah soal */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Jumlah Soal</label>
            <div className="flex gap-2">
              {JUMLAH.map(n => (
                <button key={n} onClick={() => setJumlah(n)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                    jumlah === n
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Tipe & Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Tipe Soal</label>
              <select value={tipe} onChange={e => setTipe(e.target.value as Tipe)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-sm text-white outline-none">
                <option value="pilihan_ganda">Pilihan Ganda</option>
                <option value="essay">Essay</option>
                <option value="campuran">Campuran</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Kesulitan</label>
              <select value={level} onChange={e => setLevel(e.target.value as Level)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-sm text-white outline-none">
                <option value="mudah">Mudah</option>
                <option value="sedang">Sedang</option>
                <option value="sulit">Sulit</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
              <i className="bi bi-exclamation-triangle shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleGenerate} disabled={!canSubmit || loading}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white glow-violet">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Gemini sedang buat soal...
              </>
            ) : (
              <><i className="bi bi-lightning-charge-fill" /> Generate {jumlah} Soal</>
            )}
          </button>

          {loading && (
            <p className="text-center text-xs text-slate-500 animate-pulse">
              Biasanya butuh 5–15 detik tergantung jumlah soal...
            </p>
          )}
        </div>

      </div>
    </div>
  )
}

export default function GeneratePage() {
  return (
    <Suspense>
      <GenerateForm />
    </Suspense>
  )
}
