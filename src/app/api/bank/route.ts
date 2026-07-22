import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/bank?kategori=TWK — daftar paket soal publik (tanpa login)
export async function GET(req: NextRequest) {
  const kategori = new URL(req.url).searchParams.get('kategori')
  const where = kategori ? { kategori } : {}
  const rows = await prisma.bankSoal.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: { id: true, kategori: true, subKategori: true, judul: true, jumlah: true, level: true, createdAt: true },
  })
  return NextResponse.json(rows)
}
