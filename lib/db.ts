import { PrismaClient } from '@prisma/client'

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
}
