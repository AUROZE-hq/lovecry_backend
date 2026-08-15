import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, destroyAdminSession } from '@/lib/auth/admin-gate';
import { assertSameOrigin } from '@/lib/security/request-guard';

export async function POST(request: Request) {
  const origin = assertSameOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: origin.status });
  }

  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  await destroyAdminSession(token);
  jar.delete(ADMIN_SESSION_COOKIE);
  jar.delete('lovecry_admin_gate');
  return NextResponse.json({ ok: true });
}
