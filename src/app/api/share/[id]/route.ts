import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/share/[id] — akses PUBLIK (tanpa login) untuk kuis yang dibagikan.
// Hanya mengembalikan kuis dengan shared=true.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = await prisma.savedQuiz.findUnique({ where: { id: params.id } })
  if (!row || !row.shared) return NextResponse.json({ error: 'Kuis tidak tersedia' }, { status: 404 })

  return NextResponse.json({
    soal: row.soal,
    meta: {
      topik: row.topik,
      kategori: row.kategori,
      jumlah: row.jumlah,
      tipe: row.tipe,
      level: row.level,
    },
  })
}
