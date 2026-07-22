import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/saved — daftar soal tersimpan milik user (dari SSO).
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.savedQuiz.findMany({
    where: { userEmail: session.email },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({
    saved: rows.map((r) => ({
      savedId: r.id,
      soal: r.soal,
      meta: { topik: r.topik, kategori: r.kategori, jumlah: r.jumlah, tipe: r.tipe, level: r.level },
      savedAt: r.createdAt.toISOString(),
      bestScore: r.bestScore,
      shared: r.shared,
    })),
  })
}

// POST /api/saved — simpan soal baru. Body: { soal, meta, score? }
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { soal, meta, score } = await req.json()
  if (!Array.isArray(soal) || soal.length === 0) return NextResponse.json({ error: 'Soal kosong' }, { status: 400 })

  const row = await prisma.savedQuiz.create({
    data: {
      userEmail: session.email,
      topik: meta?.topik || 'Tanpa judul',
      kategori: meta?.kategori || '',
      jumlah: Number(meta?.jumlah) || soal.length,
      tipe: meta?.tipe || 'pilihan_ganda',
      level: meta?.level || 'sedang',
      soal,
      bestScore: typeof score === 'number' ? score : null,
    },
  })
  return NextResponse.json({ savedId: row.id })
}
