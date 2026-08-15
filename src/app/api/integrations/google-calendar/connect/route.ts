import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { AuthError, requirePermission } from '@/lib/auth/permissions';
import { isGoogleOAuthConfigured } from '@/lib/config/counselling-env';
import { donationEnv } from '@/lib/config/env';
import { getGoogleAuthUrl } from '@/lib/google/calendar';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const site = donationEnv.siteUrl.replace(/\/$/, '');
  try {
    const admin = await requirePermission('counselling.google');
    if (!isGoogleOAuthConfigured()) {
      return NextResponse.redirect(`${site}/admin/counselling/google-integration?error=not_configured`);
    }

    const state = randomBytes(24).toString('base64url');
    await prisma.googleOAuthState.create({
      data: {
        state,
        adminId: admin.id,
        expiresAt: new Date(Date.now() + 10 * 60_000),
      },
    });

    return NextResponse.redirect(getGoogleAuthUrl(state));
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.redirect(`${site}/admin`);
    }
    return NextResponse.redirect(
      `${site}/admin/counselling/google-integration?error=connect_failed`
    );
  }
}
