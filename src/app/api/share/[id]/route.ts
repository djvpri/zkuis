import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const quiz = await prisma.savedQuiz.findUnique({
    where: { id },
    select: {
      id: true,
      topik: true,
      kategori: true,
      jumlah: true,
      tipe: true,
      level: true,
      soal: true,
      shared: true,
      publicAttempts: {
        orderBy: [{ skor: 'desc' }, { createdAt: 'asc' }],
        take: 10,
        select: { id: true, nama: true, skor: true, total: true, durasi: true, createdAt: true },
      },
    },
  })

  if (!quiz || !quiz.shared) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(quiz)
}
