import { NextRequest, NextResponse } from 'next/server'
import prisma, { getServices } from '@/lib/db'
import { slugify } from '@/lib/services'

export async function GET() {
  const services = await getServices()
  return NextResponse.json({ services })
}

export async function POST(req: NextRequest) {
  const { label, emoji, minutes } = await req.json()
  if (!label || !emoji || !minutes || minutes < 1) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const id = slugify(label)
  const existing = await prisma.service.findUnique({ where: { id } })
  if (existing) {
    return NextResponse.json({ error: 'Serviço com esse nome já existe' }, { status: 409 })
  }

  const last = await prisma.service.findFirst({ orderBy: { ord: 'desc' } })
  const ord = (last?.ord ?? -1) + 1

  const service = await prisma.service.create({
    data: { id, label: label.trim(), emoji: emoji.trim(), minutes: Math.round(minutes), ord },
  })
  return NextResponse.json({ service }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { id, label, emoji, minutes } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const service = await prisma.service.update({
    where: { id },
    data: {
      ...(label !== undefined && { label: label.trim() }),
      ...(emoji !== undefined && { emoji: emoji.trim() }),
      ...(minutes !== undefined && { minutes: Math.round(minutes) }),
    },
  })
  return NextResponse.json({ service })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.service.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
