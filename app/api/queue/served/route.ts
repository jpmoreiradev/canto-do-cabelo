import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  try {
    await prisma.$transaction(async (tx) => {
      await tx.queueEntry.update({ where: { id }, data: { status: 'served' } })

      const cfg = await tx.queueConfig.findUnique({ where: { key: 'last_called_id' } })
      if (cfg?.value === id) {
        await tx.queueConfig.update({ where: { key: 'last_called_id' }, data: { value: null } })
      }
    })
  } catch {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
