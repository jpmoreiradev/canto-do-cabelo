import { PrismaClient } from '@prisma/client'
import { SERVICES } from '@/lib/services'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

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
  // Seed services table if empty
  const count = await prisma.service.count()
  if (count === 0) {
    await prisma.service.createMany({ data: SERVICES })
  }
}

export async function getServices() {
  return prisma.service.findMany({ orderBy: { ord: 'asc' } })
}

export async function getServiceDurations(): Promise<Record<string, number>> {
  const services = await getServices()
  return Object.fromEntries(services.map((s) => [s.id, s.minutes]))
}
