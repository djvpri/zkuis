import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await req.json().catch(() => ({}))
  const { nama, skor, total, durasi } = body as Record<string, unknown>

  if (!nama || typeof skor !== 'number' || typeof total !== 'number') {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  }

  const quiz = await prisma.savedQuiz.findUnique({ where: { id }, select: { shared: true } })
  if (!quiz?.shared) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.publicAttempt.create({
    data: {
      savedId: id,
      nama: String(nama).trim().slice(0, 50),
      skor,
      total,
      durasi: typeof durasi === 'number' ? durasi : null,
    },
  })

  const leaderboard = await prisma.publicAttempt.findMany({
    where: { savedId: id },
    orderBy: [{ skor: 'desc' }, { createdAt: 'asc' }],
    take: 10,
    select: { id: true, nama: true, skor: true, total: true, durasi: true, createdAt: true },
  })

  return NextResponse.json({ ok: true, leaderboard })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const leaderboard = await prisma.publicAttempt.findMany({
    where: { savedId: id },
    orderBy: [{ skor: 'desc' }, { createdAt: 'asc' }],
    take: 10,
    select: { id: true, nama: true, skor: true, total: true, durasi: true, createdAt: true },
  })
  return NextResponse.json(leaderboard)
}
