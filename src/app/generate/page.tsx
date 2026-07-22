'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

type Mode = 'topik' | 'materi'
type Tipe = 'pilihan_ganda' | 'essay' | 'campuran'
type Level = 'mudah' | 'sedang' | 'sulit'

const KATEGORI = ['SMA / SMP', 'Perguruan Tinggi', 'CPNS / Sertifikasi', 'Umum / Trivia', 'IT & Coding', 'Kesehatan & Sains']
const JUMLAH   = [10, 20, 50, 100]

const MAX_FILE_MB = 10
const MAX_TOTAL_MB = 15
const ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp'

function fmtSize(b: number) { return b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB` }

// File -> base64 (tanpa prefix data URI) untuk dikirim ke Gemini sebagai inlineData.
function fileToInline(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ mimeType: file.type, data: (reader.result as string).split(',')[1] })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function GenerateForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode]         = useState<Mode>((searchParams.get('mode') as Mode) || 'topik')
  const [topik, setTopik]       = useState('')
  const [materi, setMateri]     = useState('')
  const [files, setFiles]       = useState<File[]>([])
  const [kategori, setKategori] = useState(searchParams.get('kategori') || KATEGORI[0])
  const [jumlah, setJumlah]     = useState(10)
  const [tipe, setTipe]         = useState<Tipe>('pilihan_ganda')
  const [level, setLevel]       = useState<Level>('sedang')
  const [timerEnabled, setTimerEnabled]   = useState(false)
  const [timerDuration, setTimerDuration] = useState(30)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Gate: wajib login SSO Zomet untuk memakai generator (lindungi kuota AI).
  useEffect(() => {
    fetch('/api/auth/me').then((r) => { if (r.status === 401) router.replace('/login') }).catch(() => {})
  }, [router])

  const canSubmit = mode === 'topik' ? topik.trim().length >= 3 : (materi.trim().length >= 50 || files.length > 0)

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || [])
    e.target.value = '' // izinkan pilih file yang sama lagi
    if (!picked.length) return
    const tooBig = picked.find(f => f.size > MAX_FILE_MB * 1024 * 1024)
    if (tooBig) { setError(`File "${tooBig.name}" melebihi ${MAX_FILE_MB} MB`); return }
    setFiles(prev => {
      const next = [...prev, ...picked]
      const total = next.reduce((s, f) => s + f.size, 0)
      if (total > MAX_TOTAL_MB * 1024 * 1024) { setError(`Total lampiran melebihi ${MAX_TOTAL_MB} MB`); return prev }
      setError('')
      return next
    })
  }
  function removeFile(i: number) { setFiles(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleGenerate() {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const lampiran = mode === 'materi' && files.length ? await Promise.all(files.map(fileToInline)) : []
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, topik: topik.trim(), materi: materi.trim(), kategori, jumlah, tipe, level, lampiran }),
      })
      if (res.status === 401) { router.replace('/login'); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal generate soal')

      const id = crypto.randomUUID()
      sessionStorage.setItem(`zkuis_${id}`, JSON.stringify({
        soal: data.soal,
        meta: { topik: topik || 'Dari Materi', kategori, jumlah, tipe, level },
        timer: timerEnabled ? { duration: timerDuration, endsAt: Date.now() + timerDuration * 60 * 1000 } : null,
      }))
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
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Materi Soal *</label>
              <textarea
                value={materi} onChange={e => setMateri(e.target.value)} rows={5}
                placeholder="Tempel teks dari buku, catatan, slide, atau artikel di sini — ATAU upload PDF/gambar di bawah."
                className="w-full bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors resize-none"
              />
              <p className={`text-xs mt-1.5 ${(materi.length >= 50 || files.length > 0) ? 'text-emerald-500' : 'text-slate-600'}`}>
                {files.length > 0
                  ? `${files.length} lampiran · teks jadi opsional`
                  : `${materi.length} karakter ${materi.length < 50 ? '(minimal 50, atau upload file)' : '✓'}`}
              </p>

              {/* Upload PDF / gambar */}
              <label className="mt-3 flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-slate-700 hover:border-violet-500/60 rounded-xl px-4 py-4 text-sm text-slate-400 hover:text-violet-300 transition-colors">
                <i className="bi bi-cloud-arrow-up text-lg" />
                <span>Upload PDF atau gambar (bisa beberapa)</span>
                <input type="file" accept={ACCEPT} multiple className="hidden" onChange={onPickFiles} />
              </label>
              <p className="text-xs text-slate-600 mt-1.5">PDF / PNG / JPG / WebP · maks {MAX_FILE_MB}MB per file, total {MAX_TOTAL_MB}MB. Gemini membaca isinya langsung.</p>

              {files.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                      <i className={`bi ${f.type === 'application/pdf' ? 'bi-file-earmark-pdf text-red-400' : 'bi-file-earmark-image text-violet-400'} shrink-0`} />
                      <span className="flex-1 truncate text-slate-300">{f.name}</span>
                      <span className="text-xs text-slate-500 shrink-0">{fmtSize(f.size)}</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 shrink-0" aria-label="Hapus">
                        <i className="bi bi-x-lg text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
            <div className="flex gap-2 flex-wrap">
              {JUMLAH.map(n => (
                <button key={n} onClick={() => setJumlah(n)}
                  className={`flex-1 min-w-[56px] py-3 rounded-xl text-sm font-bold border transition-all ${
                    jumlah === n
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}>
                  {n}
                </button>
              ))}
              <input type="number" min={1} max={100} value={jumlah}
                onChange={e => setJumlah(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                className="w-20 bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-xl px-2 py-3 text-sm text-white text-center outline-none"
                aria-label="Jumlah soal custom" />
            </div>
            <p className="text-xs text-slate-600 mt-1.5">Bisa diketik manual — maksimal 100 soal.</p>
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

          {/* Waktu pengerjaan (timer) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Waktu Pengerjaan</label>
              <button type="button" onClick={() => setTimerEnabled(v => !v)} className="flex items-center gap-2">
                <div className={`w-9 h-5 rounded-full transition-colors relative ${timerEnabled ? 'bg-violet-600' : 'bg-slate-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${timerEnabled ? 'left-4' : 'left-0.5'}`} />
                </div>
                <span className={`text-xs ${timerEnabled ? 'text-violet-300' : 'text-slate-500'}`}>{timerEnabled ? 'Aktif' : 'Tanpa batas'}</span>
              </button>
            </div>
            {timerEnabled && (
              <>
                <div className="flex flex-wrap gap-2">
                  {[15, 30, 60, 90].map(min => (
                    <button key={min} type="button" onClick={() => setTimerDuration(min)}
                      className={`flex-1 min-w-[56px] py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        timerDuration === min ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}>
                      {min} mnt
                    </button>
                  ))}
                  <input type="number" min={1} max={300} value={timerDuration}
                    onChange={e => setTimerDuration(Math.max(1, Math.min(300, Number(e.target.value) || 1)))}
                    className="w-20 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-2 py-2.5 text-sm text-white text-center outline-none"
                    aria-label="Durasi timer menit" />
                </div>
                <p className="text-xs text-amber-400/70 mt-1.5"><i className="bi bi-clock me-1" />Kuis otomatis berakhir setelah {timerDuration} menit.</p>
              </>
            )}
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
              Biasanya 5–15 detik; untuk 50–100 soal bisa ~30–60 detik...
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
