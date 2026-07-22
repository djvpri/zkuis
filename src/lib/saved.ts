// Soal tersimpan — kini disimpan di Postgres per user (via SSO), bukan
// localStorage. Semua fungsi async (memanggil /api/saved). Butuh login.

export interface SoalItem {
  id: number
  pertanyaan: string
  tipe: string
  opsi: Record<string, string> | null
  jawaban: string
  pembahasan: string
}

export interface SavedQuiz {
  savedId: string
  soal: SoalItem[]
  meta: {
    topik: string
    kategori: string
    jumlah: number
    tipe: string
    level: string
  }
  savedAt: string
  bestScore: number | null
}

export async function getSaved(): Promise<SavedQuiz[]> {
  try {
    const res = await fetch('/api/saved')
    if (!res.ok) return []
    const data = await res.json()
    return (data.saved as SavedQuiz[]) || []
  } catch { return [] }
}

export async function saveQuiz(
  soal: SoalItem[],
  meta: SavedQuiz['meta'],
  score: number | null
): Promise<string | null> {
  try {
    const res = await fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soal, meta, score }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data.savedId as string) || null
  } catch { return null }
}

export async function updateBestScore(savedId: string, score: number): Promise<void> {
  try {
    await fetch(`/api/saved/${savedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bestScore: score }),
    })
  } catch { /* ignore */ }
}

export async function deleteQuiz(savedId: string): Promise<void> {
  try { await fetch(`/api/saved/${savedId}`, { method: 'DELETE' }) } catch { /* ignore */ }
}

export async function renameQuiz(savedId: string, newName: string): Promise<void> {
  try {
    await fetch(`/api/saved/${savedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topik: newName }),
    })
  } catch { /* ignore */ }
}

// Catat hasil pengerjaan kuis (untuk riwayat/statistik).
export async function recordAttempt(input: {
  savedQuizId?: string | null
  topik: string
  score: number
  total: number
  durasiDetik?: number | null
}): Promise<void> {
  try {
    await fetch('/api/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch { /* ignore */ }
}
