import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST() {
  const entry = await prisma.$transaction(async (tx) => {
    const next = await tx.queueEntry.findFirst({
      where: { status: 'waiting' },
      orderBy: { ticket: 'asc' },
    })

    if (!next) return null

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

  if (!entry) return NextResponse.json({ error: 'Fila vazia' }, { status: 404 })

  return NextResponse.json({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
    calledAt: entry.calledAt?.toISOString() ?? null,
  })
}
