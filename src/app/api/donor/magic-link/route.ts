import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DONOR_COOKIE } from '@/lib/auth/donor-gate';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = z.object({ email: z.string().email() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const jar = await cookies();
  jar.set(DONOR_COOKIE, parsed.data.email.toLowerCase(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 6,
  });

  return NextResponse.json({ ok: true });
}
