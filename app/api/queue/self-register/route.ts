import { NextRequest, NextResponse } from 'next/server'
import { verifyTvToken } from '@/lib/auth'
import prisma from '@/lib/db'

export async function POST(req: NextRequest) {
  const { token, name, services } = await req.json()

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token ausente' }, { status: 401 })
  }

  const payload = await verifyTvToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'QR code expirado ou inválido' }, { status: 401 })
  }

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
