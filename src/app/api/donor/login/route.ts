import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DonorAuthError, issueDonorMagicLink, signInDonorWithPassword } from '@/lib/auth/donor-gate';
import { assertSameOrigin } from '@/lib/security/request-guard';

/**
 * Secure donor sign-in.
 * Password sign-in OR request a one-time email link.
 * Never grants portal access from email alone.
 */
export async function POST(request: Request) {
  const origin = assertSameOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: origin.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = z
    .object({
      email: z.string().email(),
      password: z.string().min(8).max(200).optional(),
      magicLink: z.boolean().optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
  }

  const meta = {
    ip: request.headers.get('x-forwarded-for') || undefined,
    ua: request.headers.get('user-agent') || undefined,
  };

  try {
    if (parsed.data.magicLink || !parsed.data.password) {
      const result = await issueDonorMagicLink({
        email: parsed.data.email,
        purpose: 'MAGIC_LINK',
      });
      return NextResponse.json({
        ok: true,
        mode: 'magic_link',
        message: 'Check your email for a secure one-time sign-in link.',
        previewUrl: result.previewUrl,
      });
    }

    const donor = await signInDonorWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
      meta,
    });
    return NextResponse.json({ ok: true, mode: 'password', donor });
  } catch (err) {
    if (err instanceof DonorAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Unable to sign in.' }, { status: 500 });
  }
}
