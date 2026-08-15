/**
 * Zeffy sync layer — stub until API credentials are pasted.
 */

import { donationEnv, isZeffyConfigured } from '@/lib/config/env';
import { addAudit } from '@/lib/donations/store';
import { getZeffyStatus } from './client';

export interface ZeffyTransactionDTO {
  id: string;
  amountCents: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  email?: string;
  campaignId?: string;
  frequency?: 'ONE_TIME' | 'MONTHLY';
  createdAt?: string;
}

export async function fetchZeffyTransactions(): Promise<ZeffyTransactionDTO[]> {
  const status = getZeffyStatus();
  if (!status.configured || !donationEnv.zeffy.syncEnabled) {
    return [];
  }

  // TODO(tomorrow): GET transactions from Zeffy API with auth header
  return [];
}

export async function runZeffySync(): Promise<{
  ok: boolean;
  imported: number;
  skipped: number;
  message: string;
}> {
  const status = getZeffyStatus();

  if (!isZeffyConfigured()) {
    await addAudit({
      action: 'ZEFFY_SYNC_SKIPPED',
      entityType: 'Integration',
      entityId: null,
      detail: status.message,
    });
    return { ok: false, imported: 0, skipped: 0, message: status.message };
  }

  if (!donationEnv.zeffy.syncEnabled) {
    const message = 'Zeffy credentials present but ZEFFY_SYNC_ENABLED=false.';
    await addAudit({
      action: 'ZEFFY_SYNC_SKIPPED',
      entityType: 'Integration',
      entityId: null,
      detail: message,
    });
    return { ok: false, imported: 0, skipped: 0, message };
  }

  const transactions = await fetchZeffyTransactions();
  // Live upsert path lands tomorrow with real payload mapping
  await addAudit({
    action: 'ZEFFY_SYNC_RAN',
    entityType: 'Integration',
    entityId: null,
    detail: `fetched=${transactions.length}`,
  });

  return {
    ok: true,
    imported: 0,
    skipped: transactions.length,
    message: `Sync completed (stub). Fetched ${transactions.length} transaction(s).`,
  };
}
