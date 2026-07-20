'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Soal {
  id: number
  pertanyaan: string
  tipe: 'pilihan_ganda' | 'essay'
  opsi: Record<string, string> | null
  jawaban: string
  pembahasan: string
}

interface QuizData {
  soal: Soal[]
  meta: { topik: string; kategori: string; jumlah: number; tipe: string; level: string }
}

const OPSI_LABEL = ['A', 'B', 'C', 'D']
const OPSI_COLOR = {
  default:  'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500',
  selected: 'bg-violet-600/20 border-violet-500 text-white',
  correct:  'bg-emerald-600/20 border-emerald-500 text-emerald-300',
  wrong:    'bg-red-600/20 border-red-500 text-red-300',
}

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router  = useRouter()

  const [data, setData]           = useState<QuizData | null>(null)
  const [idx, setIdx]             = useState(0)
  const [selected, setSelected]   = useState<string | null>(null)
  const [essayAns, setEssayAns]   = useState('')
  const [checked, setChecked]     = useState(false)
  const [hasil, setHasil]         = useState<Record<number, { jawaban: string; benar: boolean }>>({})
  const [explain, setExplain]     = useState('')
  const [loadExplain, setLoadExplain] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(`zkuis_${id}`)
    if (!raw) { router.replace('/generate'); return }
    setData(JSON.parse(raw))
  }, [id, router])

  if (!data) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  )

  const soalList  = data.soal
  const total     = soalList.length
  const soal      = soalList[idx]
  const isPG      = soal.tipe === 'pilihan_ganda'
  const progress  = ((idx) / total) * 100

  function getOpsiClass(key: string) {
    if (!checked) return selected === key ? OPSI_COLOR.selected : OPSI_COLOR.default
    if (key === soal.jawaban) return OPSI_COLOR.correct
    if (key === selected && key !== soal.jawaban) return OPSI_COLOR.wrong
    return OPSI_COLOR.default
  }

  function handleCheck() {
    if (!checked && (selected || essayAns.trim())) {
      setChecked(true)
      const jawaban = isPG ? (selected || '') : essayAns.trim()
      const benar = isPG ? jawaban === soal.jawaban : true // essay selalu "benar" (dinilai sendiri)
      setHasil(prev => ({ ...prev, [soal.id]: { jawaban, benar } }))
    }
  }

  async function handleExplain() {
    setLoadExplain(true)
    setExplain('')
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pertanyaan: soal.pertanyaan,
          jawaban_benar: isPG ? `${soal.jawaban}. ${soal.opsi?.[soal.jawaban]}` : soal.jawaban,
          jawaban_user: isPG ? `${selected}. ${soal.opsi?.[selected || '']}` : essayAns,
          pembahasan: soal.pembahasan,
        }),
      })
      const d = await res.json()
      setExplain(d.penjelasan || d.error || 'Gagal mendapat penjelasan')
    } finally {
      setLoadExplain(false)
    }
  }

  function handleNext() {
    if (idx < total - 1) {
      setIdx(i => i + 1)
      setSelected(null)
      setEssayAns('')
      setChecked(false)
      setExplain('')
    } else {
      // Simpan hasil
      const finalHasil = { ...hasil }
      if (!finalHasil[soal.id] && (selected || essayAns.trim())) {
        const jawaban = isPG ? (selected || '') : essayAns.trim()
        finalHasil[soal.id] = { jawaban, benar: isPG ? jawaban === soal.jawaban : true }
      }
      sessionStorage.setItem(`zkuis_hasil_${id}`, JSON.stringify({ ...data, hasil: finalHasil }))
      router.push(`/hasil/${id}`)
    }
  }

  const isAnswered = isPG ? selected !== null : essayAns.trim().length > 0
  const isWrong = checked && isPG && selected !== soal.jawaban

  return (
    <div className="min-h-dvh flex flex-col max-w-2xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/generate" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400">
          <i className="bi bi-x-lg text-sm" />
        </Link>
        <div className="text-sm font-semibold text-slate-400">
          <span className="text-white">{idx + 1}</span> / {total}
        </div>
        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-xs font-bold text-amber-400">
          {Object.values(hasil).filter(h => h.benar).length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }} />
      </div>

      {/* Soal card */}
      <div className="flex-1">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-5 slide-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold px-2 py-1 bg-violet-500/10 text-violet-400 rounded-lg border border-violet-500/20">
              {soal.tipe === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Essay'}
            </span>
            <span className="text-xs text-slate-600">Soal {idx + 1}</span>
          </div>
          <p className="text-base font-medium leading-relaxed">{soal.pertanyaan}</p>
        </div>

        {/* Pilihan Ganda */}
        {isPG && soal.opsi && (
          <div className="space-y-2.5">
            {OPSI_LABEL.map((key, i) => soal.opsi?.[key] ? (
              <button key={key} onClick={() => !checked && setSelected(key)}
                className={`slide-up slide-up-${i + 1} w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all text-left ${getOpsiClass(key)} ${!checked ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}>
                <span className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center font-bold text-xs shrink-0">{key}</span>
                <span className="flex-1">{soal.opsi[key]}</span>
                {checked && key === soal.jawaban && <i className="bi bi-check-circle-fill text-emerald-400 shrink-0" />}
                {checked && key === selected && key !== soal.jawaban && <i className="bi bi-x-circle-fill text-red-400 shrink-0" />}
              </button>
            ) : null)}
          </div>
        )}

        {/* Essay */}
        {!isPG && (
          <textarea value={essayAns} onChange={e => !checked && setEssayAns(e.target.value)}
            disabled={checked} rows={5}
            placeholder="Tulis jawabanmu di sini..."
            className="w-full bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors resize-none disabled:opacity-60" />
        )}

        {/* Pembahasan setelah check */}
        {checked && (
          <div className={`mt-4 p-4 rounded-xl border text-sm leading-relaxed fade-in ${
            isWrong ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2 font-semibold mb-2">
              {isWrong
                ? <><i className="bi bi-x-circle-fill text-red-400" /><span className="text-red-300">Kurang tepat</span></>
                : <><i className="bi bi-check-circle-fill text-emerald-400" /><span className="text-emerald-300">{soal.tipe === 'essay' ? 'Lihat kunci jawaban' : 'Benar!'}</span></>
              }
            </div>
            {soal.tipe === 'essay' && (
              <p className="text-slate-300 mb-2"><strong>Kunci:</strong> {soal.jawaban}</p>
            )}
            <p className="text-slate-400">{soal.pembahasan}</p>

            {/* Tombol Kenapa? — hanya untuk PG yang salah */}
            {isWrong && (
              <div className="mt-3 pt-3 border-t border-red-500/10">
                {explain ? (
                  <div className="text-slate-300 text-sm leading-relaxed">{explain}</div>
                ) : (
                  <button onClick={handleExplain} disabled={loadExplain}
                    className="flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50">
                    {loadExplain
                      ? <><span className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" /> Meminta penjelasan AI...</>
                      : <><i className="bi bi-lightbulb-fill" /> Kenapa jawabannya {soal.jawaban}?</>
                    }
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="mt-6 flex gap-3">
        {!checked ? (
          <button onClick={handleCheck} disabled={!isAnswered}
            className="flex-1 py-4 rounded-2xl font-bold text-base bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all active:scale-[0.98]">
            Cek Jawaban
          </button>
        ) : (
          <button onClick={handleNext}
            className="flex-1 py-4 rounded-2xl font-bold text-base bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            {idx < total - 1 ? <><i className="bi bi-arrow-right" /> Lanjut</> : <><i className="bi bi-flag-fill" /> Lihat Hasil</>}
          </button>
        )}
      </div>

    </div>
  )
}
