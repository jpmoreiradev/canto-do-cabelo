import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const entry = await prisma.queueEntry.findUnique({ where: { id } })
  if (!entry) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const position = await prisma.queueEntry.count({
    where: { status: 'waiting', ticket: { lt: entry.ticket } },
  })

  return NextResponse.json({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
    calledAt: entry.calledAt?.toISOString() ?? null,
    position: position + 1,
  })
}
