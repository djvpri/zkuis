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

const KEY = 'zkuis_saved'

export function getSaved(): SavedQuiz[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function saveQuiz(
  soal: SoalItem[],
  meta: SavedQuiz['meta'],
  score: number | null
): string {
  const list = getSaved()
  const savedId = crypto.randomUUID()
  list.unshift({ savedId, soal, meta, savedAt: new Date().toISOString(), bestScore: score })
  localStorage.setItem(KEY, JSON.stringify(list))
  return savedId
}

export function updateBestScore(savedId: string, score: number) {
  const list = getSaved()
  const item = list.find(q => q.savedId === savedId)
  if (item && (item.bestScore === null || score > item.bestScore)) {
    item.bestScore = score
    localStorage.setItem(KEY, JSON.stringify(list))
  }
}

export function deleteQuiz(savedId: string) {
  const list = getSaved().filter(q => q.savedId !== savedId)
  localStorage.setItem(KEY, JSON.stringify(list))
}
