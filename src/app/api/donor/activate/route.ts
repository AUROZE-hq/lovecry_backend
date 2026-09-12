import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DonorAuthError,
  activateDonorPortalWithPassword,
  issueDonorMagicLink,
  signInDonorWithPassword,
} from '@/lib/auth/donor-gate';
import { assertSameOrigin } from '@/lib/security/request-guard';

const activateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  confirmPassword: z.string().min(8).max(200).optional(),
  donationReference: z.string().optional(),
  mode: z.enum(['activate', 'sign_in']).default('activate'),
});

export async function POST(request: Request) {
  const origin = assertSameOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: origin.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = activateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid activation details.' }, { status: 400 });
  }

  if (
    parsed.data.mode === 'activate' &&
    parsed.data.confirmPassword !== undefined &&
    parsed.data.password !== parsed.data.confirmPassword
  ) {
    return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
  }

  const meta = {
    ip: request.headers.get('x-forwarded-for') || undefined,
    ua: request.headers.get('user-agent') || undefined,
  };

  try {
    if (parsed.data.mode === 'sign_in') {
      const donor = await signInDonorWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
        meta,
      });
      return NextResponse.json({ ok: true, alreadyExisted: true, donor });
    }

    const result = await activateDonorPortalWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
      donationReference: parsed.data.donationReference,
      meta,
    });
    return NextResponse.json({
      ok: true,
      alreadyExisted: result.alreadyExisted,
      donor: result.donor,
    });
  } catch (err) {
    if (err instanceof DonorAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Unable to activate donor portal.' }, { status: 500 });
  }
}

/** Secure email-link alternative */
export async function PUT(request: Request) {
  const origin = assertSameOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: origin.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = z
    .object({
      email: z.string().email(),
      donationReference: z.string().optional(),
      purpose: z.enum(['ACTIVATION', 'MAGIC_LINK']).default('MAGIC_LINK'),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
  }

  try {
    const result = await issueDonorMagicLink({
      email: parsed.data.email,
      purpose: parsed.data.purpose,
      donationReference: parsed.data.donationReference,
    });
    return NextResponse.json({
      ok: true,
      message: 'If that email can receive mail, a secure link is on its way.',
      previewUrl: result.previewUrl,
    });
  } catch (err) {
    if (err instanceof DonorAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Unable to send sign-in link.' }, { status: 500 });
  }
}
