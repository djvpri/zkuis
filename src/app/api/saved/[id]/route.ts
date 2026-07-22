import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PATCH /api/saved/[id] — rename (topik) dan/atau update bestScore.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await prisma.savedQuiz.findUnique({ where: { id: params.id } })
  if (!row || row.userEmail !== session.email) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  const body = await req.json()
  const data: { topik?: string; bestScore?: number; shared?: boolean } = {}
  if (typeof body.topik === 'string' && body.topik.trim()) data.topik = body.topik.trim()
  if (typeof body.bestScore === 'number' && (row.bestScore === null || body.bestScore > row.bestScore)) data.bestScore = body.bestScore
  if (typeof body.shared === 'boolean') data.shared = body.shared

  if (Object.keys(data).length) await prisma.savedQuiz.update({ where: { id: params.id }, data })
  return NextResponse.json({ ok: true })
}

// DELETE /api/saved/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await prisma.savedQuiz.findUnique({ where: { id: params.id } })
  if (!row || row.userEmail !== session.email) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  await prisma.savedQuiz.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
