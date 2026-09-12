import { NextResponse } from 'next/server';
import { DonorAuthError, consumeDonorAuthToken } from '@/lib/auth/donor-gate';

/**
 * Legacy path removed: this route no longer sets an email cookie.
 * Prefer /donor/auth/verify for token consumption.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Email-only portal access has been removed. Use password activation or a secure emailed link.',
    },
    { status: 410 }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/donor?error=missing_token', url.origin));
  }

  try {
    await consumeDonorAuthToken(token, {
      ip: request.headers.get('x-forwarded-for') || undefined,
      ua: request.headers.get('user-agent') || undefined,
    });
    return NextResponse.redirect(new URL('/donor/donations', url.origin));
  } catch (err) {
    const message = err instanceof DonorAuthError ? err.message : 'invalid_token';
    return NextResponse.redirect(
      new URL(`/donor?error=${encodeURIComponent(message)}`, url.origin)
    );
  }
}
