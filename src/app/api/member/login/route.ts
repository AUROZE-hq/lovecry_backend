import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MEMBER_COOKIE } from '@/lib/auth/member-gate';
import { upsertMemberProfile } from '@/lib/members/store';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = z
    .object({
      email: z.string().email(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  upsertMemberProfile(email, {
    firstName: parsed.data.firstName || '',
    lastName: parsed.data.lastName || '',
  });

  const jar = await cookies();
  jar.set(MEMBER_COOKIE, email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true });
}
