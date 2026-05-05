import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  const [entries, config] = await Promise.all([
    prisma.queueEntry.findMany({ orderBy: { ticket: 'asc' } }),
    prisma.queueConfig.findMany(),
  ])

  const configMap = Object.fromEntries(config.map((c) => [c.key, c.value]))

  return NextResponse.json({
    entries: entries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      calledAt: e.calledAt?.toISOString() ?? null,
    })),
    currentTicket: parseInt(configMap.current_ticket ?? '0'),
    lastCalledId: configMap.last_called_id ?? null,
  })
}

// Admin only — protected by middleware
export async function POST(req: NextRequest) {
  const { name, services } = await req.json()
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  }

  const serviceList: string[] = Array.isArray(services) ? services : []

  const entry = await prisma.$transaction(async (tx) => {
    const updated = await tx.$queryRaw<{ value: string }[]>`
      UPDATE queue_config SET value = (value::int + 1)::text
      WHERE key = 'current_ticket' RETURNING value
    `
    const ticket = parseInt(updated[0].value)
    return tx.queueEntry.create({ data: { name: name.trim(), ticket, services: serviceList } })
  })

  return NextResponse.json(
    { ...entry, createdAt: entry.createdAt.toISOString() },
    { status: 201 },
  )
}
