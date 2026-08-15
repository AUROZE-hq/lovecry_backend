/**
 * Zeffy API stubs — fill credentials tomorrow.
 * All calls are server-side only. Never expose ZEFFY_API_KEY to the browser.
 */

import { donationEnv, isZeffyConfigured } from '@/lib/config/env';

export { isZeffyConfigured };

export interface ZeffyClientStatus {
  configured: boolean;
  syncEnabled: boolean;
  message: string;
}

export function getZeffyStatus(): ZeffyClientStatus {
  if (!isZeffyConfigured()) {
    return {
      configured: false,
      syncEnabled: false,
      message:
        'Zeffy is not configured yet. Paste ZEFFY_API_KEY, ZEFFY_ORGANIZATION_ID, and ZEFFY_DEFAULT_EMBED_URL when ready.',
    };
  }

  return {
    configured: true,
    syncEnabled: donationEnv.zeffy.syncEnabled,
    message: donationEnv.zeffy.syncEnabled
      ? 'Zeffy sync is enabled.'
      : 'Zeffy credentials found, but ZEFFY_SYNC_ENABLED is false.',
  };
}

/** Placeholder sync — returns empty until real API is wired */
export async function syncZeffyDonations(): Promise<{
  imported: number;
  skipped: number;
  errors: string[];
}> {
  const status = getZeffyStatus();
  if (!status.configured || !status.syncEnabled) {
    return { imported: 0, skipped: 0, errors: [status.message] };
  }

  // TODO(tomorrow): call Zeffy HTTP API with donationEnv.zeffy.*
  return { imported: 0, skipped: 0, errors: ['Zeffy live sync will be implemented once API access is confirmed.'] };
}
