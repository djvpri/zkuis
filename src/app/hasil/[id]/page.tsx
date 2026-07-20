'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { saveQuiz, updateBestScore } from '@/lib/saved'

interface Soal {
  id: number; pertanyaan: string; tipe: string
  opsi: Record<string, string> | null; jawaban: string; pembahasan: string
}
interface HasilData {
  soal: Soal[]
  meta: { topik: string; kategori: string; jumlah: number; tipe: string; level: string }
  hasil: Record<number, { jawaban: string; benar: boolean }>
  savedId?: string
}

export default function HasilPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router  = useRouter()
  const [data, setData]         = useState<HasilData | null>(null)
  const [expand, setExpand]     = useState<number | null>(null)
  const [savedId, setSavedId]   = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(`zkuis_hasil_${id}`)
    if (!raw) { router.replace('/generate'); return }
    const parsed: HasilData = JSON.parse(raw)
    setData(parsed)

    if (parsed.savedId) {
      setSavedId(parsed.savedId)
      // Update best score jika ini adalah replay dari soal tersimpan
      const pg = parsed.soal.filter(s => s.tipe === 'pilihan_ganda').length
      const bn = Object.values(parsed.hasil).filter(h => h.benar).length
      const sk = pg > 0 ? Math.round((bn / pg) * 100) : 100
      updateBestScore(parsed.savedId, sk)
    }
  }, [id, router])

  if (!data) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  )

  const totalPG  = data.soal.filter(s => s.tipe === 'pilihan_ganda').length
  const benar    = Object.values(data.hasil).filter(h => h.benar).length
  const skor     = totalPG > 0 ? Math.round((benar / totalPG) * 100) : 100
  const skorColor = skor >= 80 ? 'text-emerald-400' : skor >= 60 ? 'text-amber-400' : 'text-red-400'
  const skorLabel = skor >= 80 ? 'Luar Biasa!' : skor >= 60 ? 'Cukup Baik' : 'Perlu Latihan Lagi'
  const skorDesc  = skor >= 80 ? 'Penguasaan materimu sangat baik.' : skor >= 60 ? 'Terus berlatih untuk hasil lebih baik.' : 'Jangan menyerah, ulangi latihan ini.'

  function handleSave() {
    if (savedId) return
    const newId = saveQuiz(data.soal, data.meta, skor)
    const updated = { ...data, savedId: newId }
    sessionStorage.setItem(`zkuis_hasil_${id}`, JSON.stringify(updated))
    setSavedId(newId)
    setJustSaved(true)
  }

  return (
    <div className="min-h-dvh max-w-2xl mx-auto px-4 py-8 pb-16">

      {/* Skor utama */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-300 text-xs font-semibold mb-5">
          <i className="bi bi-trophy-fill" /> Hasil Latihan
        </div>

        {totalPG > 0 ? (
          <>
            <div className={`text-8xl font-black mb-2 ${skorColor}`}>{skor}</div>
            <div className="text-slate-500 text-sm mb-1">dari 100</div>
          </>
        ) : (
          <div className="text-5xl mb-2">✓</div>
        )}

        <div className="text-xl font-bold mb-1">{skorLabel}</div>
        <div className="text-slate-400 text-sm">{skorDesc}</div>

        {totalPG > 0 && (
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{benar}</div>
              <div className="text-xs text-slate-500 mt-0.5">Benar</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{totalPG - benar}</div>
              <div className="text-xs text-slate-500 mt-0.5">Salah</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">{data.soal.length - totalPG}</div>
              <div className="text-xs text-slate-500 mt-0.5">Essay</div>
            </div>
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {[
          { icon: 'bi-book', label: data.meta.topik },
          { icon: 'bi-tag', label: data.meta.kategori },
          { icon: 'bi-bar-chart', label: data.meta.level },
        ].map(m => (
          <span key={m.label} className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5 text-slate-400">
            <i className={`bi ${m.icon}`} /> {m.label}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Link href={`/quiz/${id}`} onClick={() => {
          const raw = sessionStorage.getItem(`zkuis_hasil_${id}`)
          if (raw) {
            const d = JSON.parse(raw)
            sessionStorage.setItem(`zkuis_${id}`, JSON.stringify({ soal: d.soal, meta: d.meta, savedId: d.savedId }))
          }
        }}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-slate-500 text-sm font-semibold transition-all">
          <i className="bi bi-arrow-repeat" /> Ulangi
        </Link>
        <Link href="/generate"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all">
          <i className="bi bi-plus-lg" /> Soal Baru
        </Link>
      </div>

      {/* Tombol Simpan */}
      <button onClick={handleSave} disabled={!!savedId}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold border transition-all mb-8 ${
          savedId
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default'
            : 'bg-slate-900 border-slate-700 hover:border-violet-500/50 hover:text-violet-300 text-slate-300'
        }`}>
        <i className={`bi ${savedId ? 'bi-bookmark-check-fill' : 'bi-bookmark-plus'}`} />
        {savedId
          ? justSaved ? 'Soal berhasil disimpan!' : 'Soal Tersimpan'
          : 'Simpan Soal Ini'}
        {savedId && (
          <Link href="/saved" onClick={e => e.stopPropagation()}
            className="ml-2 text-xs text-slate-400 hover:text-white underline underline-offset-2">
            Lihat
          </Link>
        )}
      </button>

      {/* Review soal */}
      <h2 className="font-bold mb-4 flex items-center gap-2">
        <i className="bi bi-list-check text-violet-400" /> Review Jawaban
      </h2>

      <div className="space-y-3">
        {data.soal.map((soal, i) => {
          const h     = data.hasil[soal.id]
          const isPG  = soal.tipe === 'pilihan_ganda'
          const benar = h?.benar
          const open  = expand === soal.id

          return (
            <div key={soal.id} className={`rounded-2xl border transition-all ${
              !isPG ? 'border-slate-700 bg-slate-900/50'
              : benar ? 'border-emerald-500/30 bg-emerald-500/5'
              : h ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700 bg-slate-900/50'
            }`}>
              <button onClick={() => setExpand(open ? null : soal.id)}
                className="w-full flex items-start gap-3 p-4 text-left">
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                  !isPG ? 'bg-slate-700 text-slate-400'
                  : benar ? 'bg-emerald-500 text-white'
                  : h ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{soal.pertanyaan}</p>
                  {h && isPG && (
                    <p className="text-xs text-slate-500 mt-1">
                      Jawaban kamu: <span className={benar ? 'text-emerald-400' : 'text-red-400'}>{h.jawaban}</span>
                      {!benar && <span className="text-slate-500"> · Benar: <span className="text-emerald-400">{soal.jawaban}</span></span>}
                    </p>
                  )}
                  {!isPG && <p className="text-xs text-slate-500 mt-0.5">Essay — lihat kunci jawaban</p>}
                </div>
                <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'} text-slate-500 shrink-0 mt-1`} />
              </button>

              {open && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-700/50 mt-1 fade-in">
                  {isPG && soal.opsi && (
                    <div className="space-y-1.5 mb-3 mt-3">
                      {Object.entries(soal.opsi).map(([key, val]) => (
                        <div key={key} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                          key === soal.jawaban ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : key === h?.jawaban && key !== soal.jawaban ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                          : 'text-slate-500'
                        }`}>
                          <span className="font-bold w-4">{key}</span> {val}
                        </div>
                      ))}
                    </div>
                  )}
                  {!isPG && (
                    <div className="mt-3 mb-3 p-3 bg-slate-800 rounded-xl">
                      <p className="text-xs font-semibold text-slate-400 mb-1">Kunci Jawaban:</p>
                      <p className="text-sm text-slate-300">{soal.jawaban}</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-300">Pembahasan: </span>{soal.pembahasan}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
