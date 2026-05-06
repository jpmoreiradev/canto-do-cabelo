import { NextRequest, NextResponse } from 'next/server'
import prisma, { getServiceDurations } from '@/lib/db'
import { calcMinutes } from '@/lib/services'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const entry = await prisma.queueEntry.findUnique({ where: { id } })
  if (!entry) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const position = await prisma.queueEntry.count({
    where: { status: 'waiting', ticket: { lt: entry.ticket } },
  })

  const [ahead, durations] = await Promise.all([
    prisma.queueEntry.findMany({
      where: {
        OR: [
          { status: 'waiting', ticket: { lt: entry.ticket } },
          { status: 'called' },
        ],
      },
      select: { services: true },
    }),
    getServiceDurations(),
  ])
  const waitMinutes = ahead.reduce((sum, e) => sum + calcMinutes(e.services, durations), 0)

  return NextResponse.json({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
    calledAt: entry.calledAt?.toISOString() ?? null,
    position: position + 1,
    waitMinutes,
  })
}
