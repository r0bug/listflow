import { PrismaClient } from '../../src/generated/prisma';

let prisma: PrismaClient | null = null;

if (process.env.DATABASE_URL) {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export { prisma };