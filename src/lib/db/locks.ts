import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

/**
 * MySQL named locks (GET_LOCK) are connection-scoped.
 * Prisma interactive transactions pin a single connection for the callback,
 * so GET_LOCK / RELEASE_LOCK on `tx` share that connection.
 *
 * Always check GET_LOCK result: 1 = acquired, 0 = timeout, null = error.
 */
export async function acquireBookingLock(
  tx: Prisma.TransactionClient,
  lockName: string,
  timeoutSec = 10
): Promise<boolean> {
  const rows = await tx.$queryRaw<Array<{ acquired: number | null }>>`
    SELECT GET_LOCK(${lockName}, ${timeoutSec}) AS acquired
  `;
  return rows[0]?.acquired === 1;
}

export async function releaseBookingLock(
  tx: Prisma.TransactionClient,
  lockName: string
): Promise<void> {
  await tx.$queryRaw`SELECT RELEASE_LOCK(${lockName})`;
}

export function bookingLockName(counsellorId: string): string {
  // MySQL lock names max 64 chars
  return `lovecry_book_${counsellorId}`.slice(0, 64);
}

export { prisma };
