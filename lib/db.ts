import { PrismaClient } from '@prisma/client'
import { SERVICES } from '@/lib/services'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

// Seed initial config rows if missing
export async function initDB() {
  await prisma.queueConfig.upsert({
    where: { key: 'current_ticket' },
    update: {},
    create: { key: 'current_ticket', value: '0' },
  })
  await prisma.queueConfig.upsert({
    where: { key: 'last_called_id' },
    update: {},
    create: { key: 'last_called_id', value: null },
  })
  for (const s of SERVICES) {
    await prisma.queueConfig.upsert({
      where: { key: `svc_${s.id}` },
      update: {},
      create: { key: `svc_${s.id}`, value: String(s.minutes) },
    })
  }
}

export async function getServiceDurations(): Promise<Record<string, number>> {
  const rows = await prisma.queueConfig.findMany({
    where: { key: { startsWith: 'svc_' } },
  })
  return Object.fromEntries(
    rows.map((r) => [r.key.replace('svc_', ''), parseInt(r.value ?? '0')]),
  )
}
