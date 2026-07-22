import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/attempt — catat hasil pengerjaan kuis.
// Body: { savedQuizId?, topik, score, total, durasiDetik? }
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { savedQuizId, topik, score, total, durasiDetik } = await req.json()
  if (typeof score !== 'number' || typeof total !== 'number') return NextResponse.json({ error: 'score/total wajib' }, { status: 400 })

  // Kalau ditaut ke soal tersimpan milik user, ikut update bestScore.
  let validSavedId: string | null = null
  if (savedQuizId) {
    const sq = await prisma.savedQuiz.findUnique({ where: { id: savedQuizId } })
    if (sq && sq.userEmail === session.email) {
      validSavedId = sq.id
      if (sq.bestScore === null || score > sq.bestScore) {
        await prisma.savedQuiz.update({ where: { id: sq.id }, data: { bestScore: score } })
      }
    }
  }

  await prisma.quizAttempt.create({
    data: {
      userEmail: session.email,
      savedQuizId: validSavedId,
      topik: topik || '',
      score,
      total,
      durasiDetik: typeof durasiDetik === 'number' ? durasiDetik : null,
    },
  })
  return NextResponse.json({ ok: true })
}

// GET /api/attempt — riwayat + statistik ringkas milik user.
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const attempts = await prisma.quizAttempt.findMany({
    where: { userEmail: session.email },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  const total = attempts.length
  const rataRata = total ? Math.round(attempts.reduce((s, a) => s + (a.total ? (a.score / a.total) * 100 : 0), 0) / total) : 0
  return NextResponse.json({
    stat: { totalPengerjaan: total, rataRataPersen: rataRata },
    riwayat: attempts.map((a) => ({
      id: a.id, topik: a.topik, score: a.score, total: a.total,
      persen: a.total ? Math.round((a.score / a.total) * 100) : 0,
      durasiDetik: a.durasiDetik, createdAt: a.createdAt.toISOString(),
    })),
  })
}
