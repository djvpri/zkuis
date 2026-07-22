import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/bank/[id] — ambil soal lengkap dari satu paket (publik)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = await prisma.bankSoal.findUnique({ where: { id: params.id } })
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  return NextResponse.json(row)
}
