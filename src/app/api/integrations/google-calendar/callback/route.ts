import { NextResponse } from 'next/server';
import { AuthError, requireAdmin } from '@/lib/auth/admin-gate';
import { exchangeCodeAndStoreTokens } from '@/lib/google/calendar';
import { prisma } from '@/lib/db/prisma';
import { logError } from '@/lib/security/logger';
import { donationEnv } from '@/lib/config/env';

export async function GET(request: Request) {
  const site = donationEnv.siteUrl.replace(/\/$/, '');
  const redirectBase = `${site}/admin/counselling/google-integration`;

  try {
    await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'COUNSELLOR_ADMIN']);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.redirect(`${site}/admin`);
    }
  }

  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(`${redirectBase}?error=oauth_${encodeURIComponent(error)}`);
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    return NextResponse.redirect(`${redirectBase}?error=missing_code`);
  }

  const saved = await prisma.googleOAuthState.findUnique({ where: { state } });
  await prisma.googleOAuthState.deleteMany({ where: { state } });

  if (!saved || saved.expiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(`${redirectBase}?error=invalid_state`);
  }

  try {
    await exchangeCodeAndStoreTokens({ code, adminUserId: saved.adminId });
    return NextResponse.redirect(`${redirectBase}?success=connected`);
  } catch (err) {
    logError('google_oauth_callback_failed', {
      integration: 'google_calendar',
      action: 'callback',
      errorCode: 'OAUTH_CALLBACK_FAILED',
      message: err instanceof Error ? err.message : 'unknown',
    });
    return NextResponse.redirect(`${redirectBase}?error=token_exchange`);
  }
}
