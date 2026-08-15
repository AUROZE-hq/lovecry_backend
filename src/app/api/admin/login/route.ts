import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  authenticateAdmin,
  createAdminSession,
} from '@/lib/auth/admin-gate';
import { assertSameOrigin } from '@/lib/security/request-guard';
import { checkRateLimit, clientIpFromRequest } from '@/lib/security/rate-limit';
import { logWarn } from '@/lib/security/logger';

export async function POST(request: Request) {
  const origin = assertSameOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: origin.status });
  }

  const ip = clientIpFromRequest(request);
  const limited = checkRateLimit({ key: `admin-login:${ip}`, limit: 10, windowMs: 15 * 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const email = body?.email?.trim().toLowerCase() || '';
  const password = body?.password || '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await authenticateAdmin(email, password);
  if (!user) {
    logWarn('admin_login_failed', { action: 'login', status: 401 });
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await createAdminSession(user, {
    ip,
    ua: request.headers.get('user-agent') || undefined,
  });

  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  // Clear legacy temp cookie if present
  jar.delete('lovecry_admin_gate');

  return NextResponse.json({ ok: true, role: user.role });
}
