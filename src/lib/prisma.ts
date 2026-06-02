import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Cache the instance in development to avoid exhausting DB connections during HMR
if (process.env.NODE_ENV === 'development') globalForPrisma.prisma = prisma
