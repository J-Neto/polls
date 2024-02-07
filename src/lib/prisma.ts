import { PrismaClient } from '@prisma/client';

// Creating prisma connection
export const prisma = new PrismaClient({
  log: ['query']
})