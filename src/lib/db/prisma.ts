import { PrismaClient } from '@prisma/client';

const PRISMA_CLIENT_GEN = 2;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaGen?: number;
};

function hasEventDelegate(client: PrismaClient | undefined): client is PrismaClient {
  return typeof (client as { event?: { findMany?: unknown } } | undefined)?.event?.findMany === 'function';
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

function getPrismaClient(): PrismaClient {
  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaGen === PRISMA_CLIENT_GEN &&
    hasEventDelegate(globalForPrisma.prisma)
  ) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();
  if (!hasEventDelegate(client)) {
    throw new Error(
      'Prisma Client is missing the Event model. Stop `npm run dev`, run `npx prisma generate`, then start the app again.'
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaGen = PRISMA_CLIENT_GEN;
  }

  return client;
}

export const prisma = getPrismaClient();

export function isUnreachableDatabase(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = 'errorCode' in err ? String((err as { errorCode?: string }).errorCode) : '';
  const prismaCode = 'code' in err ? String((err as { code?: string }).code) : '';
  const message = err instanceof Error ? err.message : '';
  return (
    code === 'P1001' ||
    prismaCode === 'P1001' ||
    prismaCode === 'P1017' ||
    /Can't reach database server/i.test(message)
  );
}
