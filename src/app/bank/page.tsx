'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BankItem {
  id: string
  kategori: string
  subKategori: string
  judul: string
  jumlah: number
  level: string
}

const TABS = [
  { key: 'SEMUA', label: 'Semua', icon: 'bi-grid-fill' },
  { key: 'TWK',   label: 'TWK',   icon: 'bi-flag-fill',      color: 'text-blue-400',    desc: 'Tes Wawasan Kebangsaan' },
  { key: 'TIU',   label: 'TIU',   icon: 'bi-calculator-fill', color: 'text-violet-400',  desc: 'Tes Intelegensia Umum' },
  { key: 'TKP',   label: 'TKP',   icon: 'bi-person-check-fill', color: 'text-emerald-400', desc: 'Tes Karakteristik Pribadi' },
] as const

type TabKey = 'SEMUA' | 'TWK' | 'TIU' | 'TKP'

const KATEGORI_COLOR: Record<string, string> = {
  TWK: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  TIU: 'bg-violet-500/10 border-violet-500/30 text-violet-300',
  TKP: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
}

const PASSING_GRADE: Record<string, { nilai: number; total: number; label: string }> = {
  TWK: { nilai: 65,  total: 30,  label: 'Minimal 65 dari 30 soal' },
  TIU: { nilai: 80,  total: 35,  label: 'Minimal 80 dari 35 soal' },
  TKP: { nilai: 166, total: 45,  label: 'Minimal 166 dari 45 soal' },
}

export default function BankPage() {
  const router = useRouter()
  const [tab, setTab]   = useState<TabKey>('SEMUA')
  const [list, setList] = useState<BankItem[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const q = tab === 'SEMUA' ? '' : `?kategori=${tab}`
    fetch(`/api/bank${q}`)
      .then(r => r.json())
      .then(d => setList(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [tab])

  async function mulai(item: BankItem) {
    setStarting(item.id)
    try {
      const res = await fetch(`/api/bank/${item.id}`)
      const data = await res.json()
      if (!data.soal) return
      const newId = crypto.randomUUID()
      sessionStorage.setItem(`zkuis_${newId}`, JSON.stringify({
        soal: data.soal,
        meta: {
          topik: item.judul,
          kategori: `SKD CPNS — ${item.kategori}`,
          jumlah: item.jumlah,
          tipe: 'pilihan_ganda',
          level: item.level,
        },
        fromBank: item.id,
      }))
      router.push(`/quiz/${newId}`)
    } finally {
      setStarting(null)
    }
  }

  async function mulaiSimulasi() {
    setStarting('simulasi')
    try {
      // Ambil semua soal, pilih sesuai proporsi SKD: 30 TWK + 35 TIU + 45 TKP
      const [rTWK, rTIU, rTKP] = await Promise.all([
        fetch('/api/bank?kategori=TWK').then(r => r.json()),
        fetch('/api/bank?kategori=TIU').then(r => r.json()),
        fetch('/api/bank?kategori=TKP').then(r => r.json()),
      ])
      const pick = async (rows: BankItem[], n: number) => {
        const pool: unknown[] = []
        for (const row of rows) {
          if (pool.length >= n * 2) break
          const d = await fetch(`/api/bank/${row.id}`).then(r => r.json())
          if (Array.isArray(d.soal)) pool.push(...d.soal)
        }
        return pool.slice(0, n).map((s: unknown, i: number) => ({ ...(s as object), id: i + 1 }))
      }
      const [twk, tiu, tkp] = await Promise.all([
        pick(rTWK, 30), pick(rTIU, 35), pick(rTKP, 45),
      ])
      const soal = [...twk, ...tiu, ...tkp].map((s, i) => ({ ...(s as object), id: i + 1 }))
      if (soal.length < 10) { alert('Bank soal belum cukup. Hubungi admin.'); return }

      const newId = crypto.randomUUID()
      sessionStorage.setItem(`zkuis_${newId}`, JSON.stringify({
        soal,
        meta: {
          topik: 'Simulasi SKD CPNS Lengkap',
          kategori: 'SKD CPNS',
          jumlah: soal.length,
          tipe: 'pilihan_ganda',
          level: 'sedang',
        },
        timer: { duration: 100, endsAt: Date.now() + 100 * 60 * 1000 },
      }))
      router.push(`/quiz/${newId}`)
    } finally {
      setStarting(null)
    }
  }

  const grouped = list.reduce<Record<string, BankItem[]>>((acc, item) => {
    const key = item.subKategori
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-dvh max-w-2xl mx-auto px-4 py-8 pb-32">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
          <i className="bi bi-arrow-left text-sm" />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-xl">Bank Soal CPNS</h1>
          <p className="text-xs text-slate-400">SKD — Seleksi Kompetensi Dasar</p>
        </div>
        <Link href="/generate" className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-slate-800">
          <i className="bi bi-lightning-charge" /> Generate AI
        </Link>
      </div>

      {/* Passing grade info */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {Object.entries(PASSING_GRADE).map(([kat, pg]) => (
          <div key={kat} className={`rounded-xl p-3 border text-center ${KATEGORI_COLOR[kat]}`}>
            <p className="font-bold text-lg leading-none">{pg.nilai}</p>
            <p className="text-[10px] mt-1 opacity-70">passing grade</p>
            <p className="text-xs font-semibold mt-0.5">{kat}</p>
          </div>
        ))}
      </div>

      {/* Simulasi full */}
      <button onClick={mulaiSimulasi} disabled={!!starting}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-600 hover:opacity-90 text-white font-bold text-base transition-all active:scale-[0.99] disabled:opacity-50 mb-6 shadow-lg shadow-violet-500/20">
        {starting === 'simulasi'
          ? <><i className="bi bi-arrow-repeat animate-spin" /> Menyiapkan soal...</>
          : <><i className="bi bi-play-circle-fill text-lg" /> Simulasi SKD Lengkap
            <span className="text-xs font-normal opacity-70 ml-1">110 soal · 100 menit</span></>
        }
      </button>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-2xl mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === t.key ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}>
            <i className={`bi ${t.icon} me-1`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab description */}
      {tab !== 'SEMUA' && (
        <div className={`mb-4 px-3 py-2.5 rounded-xl border text-sm ${KATEGORI_COLOR[tab]}`}>
          <span className="font-semibold">{tab}</span>
          {' — '}
          {TABS.find(t => t.key === tab)?.desc}
          {PASSING_GRADE[tab] && (
            <span className="ml-2 opacity-70 text-xs">· {PASSING_GRADE[tab].label}</span>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <i className="bi bi-arrow-repeat text-2xl animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && list.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <i className="bi bi-inbox text-3xl mb-3 block opacity-40" />
          <p className="text-sm">Bank soal belum tersedia.</p>
          <p className="text-xs mt-1 opacity-60">Admin perlu menjalankan seeder terlebih dahulu.</p>
        </div>
      )}

      {/* List — grouped by subKategori */}
      {!loading && list.length > 0 && (
        <div className="space-y-5">
          {Object.entries(grouped).map(([sub, items]) => (
            <div key={sub}>
              <p className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase mb-2 px-1">{sub}</p>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{item.judul}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${KATEGORI_COLOR[item.kategori]}`}>
                            {item.kategori}
                          </span>
                          <span className="text-[10px] text-slate-500">{item.jumlah} soal</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => mulai(item)} disabled={!!starting}
                      className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      {starting === item.id
                        ? <><i className="bi bi-arrow-repeat animate-spin" /> Memuat...</>
                        : <><i className="bi bi-play-fill" /> Mulai Latihan</>
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
