import { donationEnv } from '@/lib/config/env';

/** Reject cross-site state-changing requests when Origin/Referer do not match the site. */
export function assertSameOrigin(req: Request): { ok: true } | { ok: false; status: number; error: string } {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const site = donationEnv.siteUrl.replace(/\/$/, '');

  if (origin) {
    if (origin.replace(/\/$/, '') !== site && !isLocalDevOrigin(origin)) {
      return { ok: false, status: 403, error: 'Invalid request origin.' };
    }
    return { ok: true };
  }

  if (referer) {
    try {
      const ref = new URL(referer);
      const allowed = new URL(site);
      if (ref.origin !== allowed.origin && !isLocalDevOrigin(ref.origin)) {
        return { ok: false, status: 403, error: 'Invalid request origin.' };
      }
      return { ok: true };
    } catch {
      return { ok: false, status: 403, error: 'Invalid request origin.' };
    }
  }

  // Non-browser clients (curl/server) without Origin — allow only in development
  if (donationEnv.appEnv === 'development' || donationEnv.appEnv === 'test') {
    return { ok: true };
  }

  return { ok: false, status: 403, error: 'Missing request origin.' };
}

function isLocalDevOrigin(origin: string): boolean {
  return (
    donationEnv.appEnv !== 'production' &&
    (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))
  );
}
