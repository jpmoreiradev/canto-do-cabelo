import { NextRequest, NextResponse } from 'next/server'
import prisma, { getServiceDurations } from '@/lib/db'
import { SERVICES } from '@/lib/services'

export async function GET() {
  const durations = await getServiceDurations()
  return NextResponse.json({ serviceDurations: durations })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const updates = SERVICES.filter((s) => typeof body[s.id] === 'number' && body[s.id] > 0)

  await Promise.all(
    updates.map((s) =>
      prisma.queueConfig.upsert({
        where: { key: `svc_${s.id}` },
        update: { value: String(Math.round(body[s.id])) },
        create: { key: `svc_${s.id}`, value: String(Math.round(body[s.id])) },
      }),
    ),
  )

  const durations = await getServiceDurations()
  return NextResponse.json({ serviceDurations: durations })
}
