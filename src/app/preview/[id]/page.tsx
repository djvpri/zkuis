'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveQuiz } from '@/lib/saved'
import { exportSoalPDF } from '@/lib/pdf'

interface Soal { id: number; pertanyaan: string; tipe: string; opsi: Record<string, string> | null; jawaban: string; pembahasan: string }
interface PreviewData {
  soal: Soal[]
  meta: { topik: string; kategori: string; jumlah: number; tipe: string; level: string }
  savedId?: string
  timer?: { duration: number; endsAt: number } | null
}

export default function PreviewPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()

  const [data, setData]       = useState<PreviewData | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [sharing, setSharing] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [toast, setToast]     = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem(`zkuis_${id}`)
    if (!raw) { router.replace('/generate'); return }
    const p: PreviewData = JSON.parse(raw)
    setData(p)
    if (p.savedId) setSavedId(p.savedId)
  }, [id, router])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [toast])

  if (!data) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  )

  function persist(next: PreviewData) {
    sessionStorage.setItem(`zkuis_${id}`, JSON.stringify(next))
    setData(next)
  }

  async function ensureSaved(): Promise<string | null> {
    if (savedId) return savedId
    if (!data) return null
    const nid = await saveQuiz(data.soal, data.meta, null)
    if (nid) { setSavedId(nid); persist({ ...data, savedId: nid }) }
    return nid
  }

  async function handleSave() {
    if (savedId || saving) return
    setSaving(true)
    const nid = await ensureSaved()
    setSaving(false)
    setToast(nid ? 'Tersimpan ke koleksi soal' : 'Gagal menyimpan — masuk lewat Z One dulu')
  }

  async function handleShare() {
    if (sharing) return
    setSharing(true)
    try {
      const nid = await ensureSaved()
      if (!nid) { setToast('Gagal menyiapkan tautan — masuk dulu'); return }
      await fetch(`/api/saved/${nid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shared: true }),
      })
      const url = `${location.origin}/share/${nid}`
      if (navigator.share) {
        try { await navigator.share({ title: data!.meta.topik, text: `Coba kuis: ${data!.meta.topik}`, url }) } catch { /* dibatalkan */ }
      } else {
        await navigator.clipboard.writeText(url)
        setToast('Tautan disalin ke clipboard')
      }
    } catch {
      setToast('Gagal membuat tautan bagikan')
    } finally {
      setSharing(false)
    }
  }

  const meta = data.meta

  return (
    <div className="min-h-dvh max-w-2xl mx-auto px-4 py-6 pb-16">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/generate" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
          <i className="bi bi-arrow-left text-sm" />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">Ringkasan Soal</h1>
          <p className="text-xs text-slate-500">Soal siap — pilih tindakan di bawah</p>
        </div>
      </div>

      {/* Kartu topik */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 border border-slate-800 rounded-2xl p-5 mb-5">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-emerald-300 text-xs font-semibold mb-3">
          <i className="bi bi-check-circle-fill" /> {data.soal.length} soal berhasil dibuat
        </div>
        <h2 className="text-xl font-bold mb-3">{meta.topik}</h2>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-400"><i className="bi bi-tag" /> {meta.kategori}</span>
          <span className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-400"><i className="bi bi-bar-chart" /> {meta.level}</span>
          <span className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-400 capitalize"><i className="bi bi-ui-checks" /> {meta.tipe.replace('_', ' ')}</span>
          {data.timer && (
            <span className="flex items-center gap-1.5 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1 text-amber-300"><i className="bi bi-clock" /> {data.timer.duration} mnt</span>
          )}
        </div>
      </div>

      {/* Aksi utama */}
      <button onClick={() => router.push(`/quiz/${id}`)}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-base font-bold transition-all active:scale-[0.98] mb-3">
        <i className="bi bi-play-fill text-lg" /> Mulai Kerjakan
      </button>

      {/* Aksi sekunder */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button onClick={handleSave} disabled={!!savedId || saving}
          className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold border transition-all ${
            savedId
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default'
              : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300'
          }`}>
          <i className={`bi ${savedId ? 'bi-bookmark-check-fill' : saving ? 'bi-arrow-repeat animate-spin' : 'bi-bookmark-plus'}`} />
          {savedId ? 'Tersimpan' : saving ? 'Menyimpan…' : 'Simpan'}
        </button>

        <button onClick={handleShare} disabled={sharing}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold border bg-slate-900 border-slate-700 hover:border-violet-500/50 hover:text-violet-300 text-slate-300 transition-all">
          <i className={`bi ${sharing ? 'bi-arrow-repeat animate-spin' : 'bi-share-fill'}`} />
          {sharing ? 'Menyiapkan…' : 'Bagikan'}
        </button>

        <button onClick={() => exportSoalPDF(data.soal, meta, false)}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold border bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300 transition-all">
          <i className="bi bi-file-earmark-text" /> PDF Soal
        </button>

        <button onClick={() => exportSoalPDF(data.soal, meta, true)}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold border bg-slate-900 border-slate-700 hover:border-emerald-500/50 hover:text-emerald-300 text-slate-300 transition-all">
          <i className="bi bi-file-earmark-check" /> PDF Kunci
        </button>
      </div>

      {/* Pratinjau soal */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <i className="bi bi-eye text-violet-400" /> Pratinjau Soal
        </h3>
        <button onClick={() => setShowKey(v => !v)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            showKey ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
          }`}>
          <i className={`bi ${showKey ? 'bi-eye-slash' : 'bi-key'}`} /> {showKey ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}
        </button>
      </div>

      <div className="space-y-3">
        {data.soal.map((s, i) => {
          const isPG = s.tipe === 'pilihan_ganda' && s.opsi
          return (
            <div key={s.id ?? i} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-relaxed">{s.pertanyaan}</p>

                  {isPG && (
                    <div className="mt-3 space-y-1.5">
                      {Object.entries(s.opsi as Record<string, string>).map(([k, v]) => {
                        const benar = showKey && k === s.jawaban
                        return (
                          <div key={k} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                            benar ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'text-slate-400 border-transparent'
                          }`}>
                            <span className="font-bold w-4">{k}</span> {v}
                            {benar && <i className="bi bi-check-lg ml-auto text-emerald-400" />}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {showKey && !isPG && (
                    <div className="mt-3 p-3 bg-slate-800 rounded-xl">
                      <p className="text-xs font-semibold text-slate-400 mb-1">Kunci Jawaban:</p>
                      <p className="text-sm text-slate-300">{s.jawaban}</p>
                    </div>
                  )}

                  {showKey && s.pembahasan && (
                    <p className="text-xs text-slate-400 leading-relaxed mt-2">
                      <span className="font-semibold text-slate-300">Pembahasan: </span>{s.pembahasan}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-600 text-slate-100 text-sm px-4 py-2.5 rounded-xl shadow-xl fade-in">
          {toast}
        </div>
      )}

    </div>
  )
}
