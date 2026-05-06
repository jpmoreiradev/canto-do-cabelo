import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { calcMinutes } from '@/lib/services'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const entry = await prisma.queueEntry.findUnique({ where: { id } })
  if (!entry) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const position = await prisma.queueEntry.count({
    where: { status: 'waiting', ticket: { lt: entry.ticket } },
  })

  // soma os serviços de quem está na frente (waiting com ticket menor) + quem está em called
  const ahead = await prisma.queueEntry.findMany({
    where: {
      OR: [
        { status: 'waiting', ticket: { lt: entry.ticket } },
        { status: 'called' },
      ],
    },
    select: { services: true },
  })
  const waitMinutes = ahead.reduce((sum, e) => sum + calcMinutes(e.services), 0)

  return NextResponse.json({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
    calledAt: entry.calledAt?.toISOString() ?? null,
    position: position + 1,
    waitMinutes,
  })
}
