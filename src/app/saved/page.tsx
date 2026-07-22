'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSaved, deleteQuiz, saveQuiz, renameQuiz, type SavedQuiz, type SoalItem } from '@/lib/saved'

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

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="flex items-center gap-2 group">
      <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${value ? 'bg-violet-600' : 'bg-slate-700'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-4' : 'left-0.5'}`} />
      </div>
      <span className={`text-xs transition-colors ${value ? 'text-slate-200' : 'text-slate-500'}`}>{label}</span>
    </button>
  )
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp
  }
  return a
}

function applyShuffleAnswers(soal: SoalItem[]): SoalItem[] {
  return soal.map(s => {
    if (s.tipe !== 'pilihan_ganda' || !s.opsi) return s
    const keys = Object.keys(s.opsi)
    const vals = shuffleArr(keys.map(k => s.opsi![k]))
    const newOpsi: Record<string, string> = {}
    keys.forEach((k, i) => { newOpsi[k] = vals[i] })
    const correctVal = s.opsi[s.jawaban]
    const newJawaban = keys.find(k => newOpsi[k] === correctVal) || s.jawaban
    return { ...s, opsi: newOpsi, jawaban: newJawaban }
  })
}

export default function SavedPage() {
  const router  = useRouter()
  const [list, setList]             = useState<SavedQuiz[]>([])
  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [shuffleQ, setShuffleQ]       = useState(false)
  const [shuffleA, setShuffleA]       = useState(false)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerDuration, setTimerDuration] = useState(30)
  const [editId, setEditId]           = useState<string | null>(null)
  const [editName, setEditName]       = useState('')

  const [loadingList, setLoadingList] = useState(true)
  useEffect(() => {
    fetch('/api/auth/me').then((r) => {
      if (r.status === 401) { router.replace('/login'); return }
      getSaved().then(setList).finally(() => setLoadingList(false))
    }).catch(() => setLoadingList(false))
  }, [router])

  function prepSoal(soal: SoalItem[]): SoalItem[] {
    let s = [...soal]
    if (shuffleQ) s = shuffleArr(s)
    if (shuffleA) s = applyShuffleAnswers(s)
    return s.map((q, i) => ({ ...q, id: i + 1 }))
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
  }

  function makeTimer() {
    return timerEnabled
      ? { duration: timerDuration, endsAt: Date.now() + timerDuration * 60 * 1000 }
      : null
  }

  function handleStart(quiz: SavedQuiz) {
    const newId = crypto.randomUUID()
    sessionStorage.setItem(`zkuis_${newId}`, JSON.stringify({
      soal: prepSoal(quiz.soal),
      meta: quiz.meta,
      savedId: quiz.savedId,
      timer: makeTimer(),
    }))
    router.push(`/quiz/${newId}`)
  }

  function startEdit(quiz: SavedQuiz) {
    setEditId(quiz.savedId)
    setEditName(quiz.meta.topik)
  }

  function confirmEdit() {
    if (!editId || !editName.trim()) { setEditId(null); return }
    void renameQuiz(editId, editName)
    setList(prev => prev.map(q =>
      q.savedId === editId ? { ...q, meta: { ...q.meta, topik: editName.trim() } } : q
    ))
    setEditId(null)
  }

  function handleDelete(savedId: string) {
    void deleteQuiz(savedId)
    setList(prev => prev.filter(q => q.savedId !== savedId))
    setDeleteId(null)
  }

  function handleMerge(andSave: boolean) {
    const picked = list.filter(q => selected.has(q.savedId))
    if (picked.length < 2) return

    const merged = prepSoal(picked.flatMap(q => q.soal))
    const names  = picked.map(q => q.meta.topik).join(' + ')
    const topik  = names.length > 60 ? names.slice(0, 57) + '...' : names
    const meta   = { topik, kategori: 'Gabungan', jumlah: merged.length, tipe: 'campuran', level: picked[0].meta.level }

    const newId = crypto.randomUUID()
    sessionStorage.setItem(`zkuis_${newId}`, JSON.stringify({ soal: merged, meta, timer: makeTimer() }))
    if (andSave) void saveQuiz(merged, meta, null)
    router.push(`/quiz/${newId}`)
  }

  const selectedCount = selected.size
  const allSelected   = list.length > 0 && selectedCount === list.length
  const totalSelected = list.filter(q => selected.has(q.savedId)).reduce((s, q) => s + q.soal.length, 0)

  return (
    <div className="min-h-dvh max-w-2xl mx-auto px-4 py-8 pb-32">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {selectMode ? (
          <button onClick={exitSelectMode}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
            <i className="bi bi-x-lg text-sm" />
          </button>
        ) : (
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
            <i className="bi bi-arrow-left text-sm" />
          </Link>
        )}
        <div className="flex-1">
          <h1 className="font-bold text-xl">Soal Tersimpan</h1>
          <p className="text-xs text-slate-400">
            {selectMode ? `${selectedCount} dipilih dari ${list.length} set` : `${list.length} set soal`}
          </p>
        </div>
        {!selectMode ? (
          <div className="flex items-center gap-2">
            {list.length >= 2 && (
              <button onClick={() => setSelectMode(true)}
                className="flex items-center gap-1.5 text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-2 rounded-xl transition-all active:scale-95">
                <i className="bi bi-collection" /> Gabung
              </button>
            )}
            <Link href="/generate"
              className="flex items-center gap-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl transition-all active:scale-95">
              <i className="bi bi-plus-lg" /> Baru
            </Link>
          </div>
        ) : (
          <button onClick={() => {
            if (allSelected) setSelected(new Set())
            else setSelected(new Set(list.map(q => q.savedId)))
          }} className="text-xs text-slate-400 hover:text-white transition-colors">
            {allSelected ? 'Batal Semua' : 'Pilih Semua'}
          </button>
        )}
      </div>

      {/* Settings panel — tampil saat ada soal & tidak di mode pilih */}
      {list.length > 0 && !selectMode && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-3 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <i className="bi bi-sliders text-slate-600 text-xs" />
            <span className="text-xs text-slate-500 font-medium">Pengaturan Latihan</span>
            {(shuffleQ || shuffleA || timerEnabled) && (
              <span className="ml-auto text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded-full px-2 py-0.5">
                Aktif
              </span>
            )}
          </div>

          {/* Shuffle */}
          <div className="flex items-center gap-5 flex-wrap mb-3">
            <Toggle label="Acak Soal" value={shuffleQ} onChange={() => setShuffleQ(v => !v)} />
            <Toggle label="Acak Jawaban" value={shuffleA} onChange={() => setShuffleA(v => !v)} />
          </div>

          {/* Timer */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center gap-3 mb-2">
              <Toggle label="Timer Ujian" value={timerEnabled} onChange={() => setTimerEnabled(v => !v)} />
              {timerEnabled && (
                <span className="text-xs text-amber-400 font-semibold ml-auto">
                  <i className="bi bi-clock me-1" />{timerDuration} menit
                </span>
              )}
            </div>
            {timerEnabled && (
              <div className="flex flex-wrap gap-2 mt-2">
                {[15, 30, 60, 90].map(min => (
                  <button key={min} onClick={() => setTimerDuration(min)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      timerDuration === min
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}>
                    {min} mnt
                  </button>
                ))}
                <div className="flex items-center gap-1.5">
                  <input type="number" min={1} max={300} value={timerDuration}
                    onChange={e => setTimerDuration(Math.max(1, Math.min(300, Number(e.target.value))))}
                    className="w-14 bg-slate-800 border border-slate-700 focus:border-amber-500/50 rounded-lg px-2 py-1.5 text-xs text-white outline-none text-center"
                  />
                  <span className="text-xs text-slate-500">mnt</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loadingList && (
        <div className="flex flex-col items-center justify-center py-24 text-center text-slate-500">
          <i className="bi bi-arrow-repeat text-2xl animate-spin mb-3" />
          <p className="text-sm">Memuat soal tersimpan…</p>
        </div>
      )}

      {/* Empty state */}
      {!loadingList && list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <i className="bi bi-bookmark text-2xl text-slate-600" />
          </div>
          <p className="font-semibold text-slate-300 mb-1">Belum ada soal tersimpan</p>
          <p className="text-sm text-slate-500 mb-6">Selesaikan latihan lalu tekan &ldquo;Simpan Soal Ini&rdquo;</p>
          <Link href="/generate"
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
            Generate Soal Sekarang
          </Link>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {list.map(quiz => {
          const isSelected = selected.has(quiz.savedId)
          return (
            <div key={quiz.savedId}
              onClick={selectMode ? () => toggleSelect(quiz.savedId) : undefined}
              className={`bg-slate-900 rounded-2xl p-4 transition-all border ${
                selectMode
                  ? isSelected
                    ? 'border-violet-500 bg-violet-500/5 cursor-pointer'
                    : 'border-slate-800 cursor-pointer hover:border-slate-600'
                  : 'border-slate-800 hover:border-slate-700'
              }`}>

              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {selectMode && (
                    <div className={`shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all ${
                      isSelected ? 'bg-violet-500 border-violet-500' : 'border-slate-600'
                    }`}>
                      {isSelected && <i className="bi bi-check text-white text-xs leading-none" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {editId === quiz.savedId ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input autoFocus value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditId(null) }}
                          className="flex-1 bg-slate-800 border border-violet-500 rounded-lg px-2.5 py-1 text-sm text-white outline-none min-w-0"
                        />
                        <button onClick={confirmEdit}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 text-white shrink-0">
                          <i className="bi bi-check-lg text-sm" />
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 shrink-0">
                          <i className="bi bi-x-lg text-xs" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group/title">
                        <p className="font-semibold text-sm truncate">{quiz.meta.topik}</p>
                        {!selectMode && (
                          <button onClick={e => { e.stopPropagation(); startEdit(quiz) }}
                            className="opacity-0 group-hover/title:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 transition-all shrink-0">
                            <i className="bi bi-pencil text-[10px]" />
                          </button>
                        )}
                      </div>
                    )}
                    {editId !== quiz.savedId && (
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(quiz.savedAt)}</p>
                    )}
                  </div>
                </div>
                {editId !== quiz.savedId && <ScoreBadge score={quiz.bestScore} />}
              </div>

              {/* Badges */}
              <div className={`flex flex-wrap gap-1.5 ${selectMode ? '' : 'mb-4'}`}>
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
              {!selectMode && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleStart(quiz)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all active:scale-[0.98]">
                    <i className="bi bi-play-fill" /> Mulai Latihan
                    {(shuffleQ || shuffleA) && <i className="bi bi-shuffle text-white/60 text-xs" />}
                  </button>
                  {deleteId === quiz.savedId ? (
                    <div className="flex gap-1.5">
                      <button onClick={e => { e.stopPropagation(); handleDelete(quiz.savedId) }}
                        className="px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all">
                        Hapus
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteId(null) }}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm transition-all">
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setDeleteId(quiz.savedId) }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-red-500/10 hover:border-red-500/30 border border-slate-700 text-slate-500 hover:text-red-400 transition-all">
                      <i className="bi bi-trash3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Sticky merge bar */}
      {selectMode && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0a0f1e]/95 backdrop-blur-xl border-t border-white/5 p-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="max-w-2xl mx-auto">

            {/* Toggles */}
            <div className="flex items-center gap-6 mb-3 px-1">
              <Toggle label="Acak Soal" value={shuffleQ} onChange={() => setShuffleQ(v => !v)} />
              <Toggle label="Acak Jawaban" value={shuffleA} onChange={() => setShuffleA(v => !v)} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleMerge(false)} disabled={selectedCount < 2}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold transition-all active:scale-[0.98]">
                <i className="bi bi-collection-play-fill" />
                Gabung & Mulai
                {selectedCount >= 2 && (
                  <span className="ml-1 bg-white/20 rounded-full px-1.5 text-xs">{totalSelected} soal</span>
                )}
              </button>
              <button onClick={() => handleMerge(true)} disabled={selectedCount < 2}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 text-sm font-bold transition-all active:scale-[0.98]">
                <i className="bi bi-bookmark-plus" /> Gabung & Simpan
              </button>
            </div>

            {selectedCount < 2 && (
              <p className="text-center text-xs text-slate-600 mt-2">Pilih minimal 2 set soal untuk digabung</p>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
