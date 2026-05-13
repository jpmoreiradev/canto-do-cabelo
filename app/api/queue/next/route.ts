import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const specificId: string | null = body?.id ?? null

  const entry = await prisma.$transaction(async (tx) => {
    const next = specificId
      ? await tx.queueEntry.findFirst({ where: { id: specificId, status: 'waiting' } })
      : await tx.queueEntry.findFirst({ where: { status: 'waiting' }, orderBy: { ticket: 'asc' } })

    if (!next) return null

    await tx.queueEntry.updateMany({
      where: { status: 'called' },
      data: { status: 'served' },
    })

    const updated = await tx.queueEntry.update({
      where: { id: next.id },
      data: { status: 'called', calledAt: new Date() },
    })

    await tx.queueConfig.update({
      where: { key: 'last_called_id' },
      data: { value: updated.id },
    })

    return updated
  })

  if (!entry) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
    calledAt: entry.calledAt?.toISOString() ?? null,
  })
}
