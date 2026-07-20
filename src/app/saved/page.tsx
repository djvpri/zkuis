'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSaved, deleteQuiz, type SavedQuiz } from '@/lib/saved'

const LEVEL_COLOR: Record<string, string> = {
  mudah: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  sedang: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  sulit: 'text-red-400 bg-red-500/10 border-red-500/20',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-500 text-xs">Belum dicoba</span>
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
  return <span className={`font-bold text-sm ${color}`}>{score}<span className="text-slate-500 text-xs font-normal">/100</span></span>
}

export default function SavedPage() {
  const router = useRouter()
  const [list, setList] = useState<SavedQuiz[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setList(getSaved())
  }, [])

  function handleStart(quiz: SavedQuiz) {
    const newId = crypto.randomUUID()
    sessionStorage.setItem(`zkuis_${newId}`, JSON.stringify({
      soal: quiz.soal,
      meta: quiz.meta,
      savedId: quiz.savedId,
    }))
    router.push(`/quiz/${newId}`)
  }

  function handleDelete(savedId: string) {
    deleteQuiz(savedId)
    setList(prev => prev.filter(q => q.savedId !== savedId))
    setDeleteId(null)
  }

  return (
    <div className="min-h-dvh max-w-2xl mx-auto px-4 py-8 pb-16">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
          <i className="bi bi-arrow-left text-sm" />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-xl">Soal Tersimpan</h1>
          <p className="text-xs text-slate-400">{list.length} set soal</p>
        </div>
        <Link href="/generate"
          className="flex items-center gap-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl transition-all active:scale-95">
          <i className="bi bi-plus-lg" /> Baru
        </Link>
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <i className="bi bi-bookmark text-2xl text-slate-600" />
          </div>
          <p className="font-semibold text-slate-300 mb-1">Belum ada soal tersimpan</p>
          <p className="text-sm text-slate-500 mb-6">Selesaikan latihan lalu tekan "Simpan Soal Ini"</p>
          <Link href="/generate"
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
            Generate Soal Sekarang
          </Link>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {list.map(quiz => (
          <div key={quiz.savedId}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all">

            {/* Top row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{quiz.meta.topik}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(quiz.savedAt)}</p>
              </div>
              <ScoreBadge score={quiz.bestScore} />
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400">
                <i className="bi bi-tag me-1" />{quiz.meta.kategori}
              </span>
              <span className={`text-xs px-2 py-1 rounded-lg border ${LEVEL_COLOR[quiz.meta.level] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                {quiz.meta.level}
              </span>
              <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400">
                {quiz.soal.length} soal
              </span>
              <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 capitalize">
                {quiz.meta.tipe.replace('_', ' ')}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => handleStart(quiz)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all active:scale-[0.98]">
                <i className="bi bi-play-fill" /> Mulai Latihan
              </button>
              {deleteId === quiz.savedId ? (
                <div className="flex gap-1.5">
                  <button onClick={() => handleDelete(quiz.savedId)}
                    className="px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all">
                    Hapus
                  </button>
                  <button onClick={() => setDeleteId(null)}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm transition-all">
                    Batal
                  </button>
                </div>
              ) : (
                <button onClick={() => setDeleteId(quiz.savedId)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-red-500/10 hover:border-red-500/30 border border-slate-700 text-slate-500 hover:text-red-400 transition-all">
                  <i className="bi bi-trash3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm delete modal */}
      {/* handled inline above */}

    </div>
  )
}
