'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Meta { topik: string; kategori: string; jumlah: number; tipe: string; level: string }
interface Soal { id: number; pertanyaan: string; tipe: string; opsi: Record<string, string> | null; jawaban: string; pembahasan: string }

export default function SharePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [state, setState] = useState<'load' | 'ready' | 'error'>('load')
  const [meta, setMeta] = useState<Meta | null>(null)
  const [soal, setSoal] = useState<Soal[]>([])

  useEffect(() => {
    fetch(`/api/share/${id}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { setSoal(d.soal || []); setMeta(d.meta); setState('ready') })
      .catch(() => setState('error'))
  }, [id])

  function mulai() {
    if (!meta) return
    const newId = crypto.randomUUID()
    sessionStorage.setItem(`zkuis_${newId}`, JSON.stringify({ soal, meta }))
    router.push(`/quiz/${newId}`)
  }

  if (state === 'load') return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  )

  if (state === 'error' || !meta) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
        <i className="bi bi-link-45deg text-2xl text-slate-600" />
      </div>
      <div>
        <p className="font-semibold text-slate-200 mb-1">Kuis tidak tersedia</p>
        <p className="text-sm text-slate-500">Tautan mungkin salah atau sudah tidak dibagikan.</p>
      </div>
      <Link href="/generate" className="text-violet-400 underline text-sm">Buat kuis sendiri</Link>
    </div>
  )

  const totalPG = soal.filter(s => s.tipe === 'pilihan_ganda').length

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center max-w-lg mx-auto px-4 py-10 text-center">
      <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-300 text-xs font-semibold mb-6">
        <i className="bi bi-share-fill" /> Kuis Dibagikan
      </div>

      <h1 className="text-2xl font-bold mb-3">{meta.topik}</h1>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {[
          { icon: 'bi-collection', label: `${soal.length} soal` },
          { icon: 'bi-tag', label: meta.kategori },
          { icon: 'bi-bar-chart', label: meta.level },
        ].filter(m => m.label).map(m => (
          <span key={m.label} className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5 text-slate-400">
            <i className={`bi ${m.icon}`} /> {m.label}
          </span>
        ))}
      </div>

      <button onClick={mulai}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-base font-bold transition-all active:scale-[0.98] mb-3">
        <i className="bi bi-play-fill" /> Mulai Kerjakan
      </button>

      <p className="text-xs text-slate-600 mt-2">
        {totalPG > 0 ? `${totalPG} pilihan ganda` : 'soal essay'} · dikerjakan tanpa perlu login
      </p>

      <Link href="/generate" className="mt-8 text-xs text-slate-500 hover:text-slate-300 transition-colors">
        <i className="bi bi-stars me-1" /> Dibuat dengan ZKuis — buat kuismu sendiri
      </Link>
    </div>
  )
}
