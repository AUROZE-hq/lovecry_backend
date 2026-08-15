import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHold, releaseHold } from '@/lib/counselling/service';
import { checkRateLimit, clientIpFromRequest } from '@/lib/security/rate-limit';

const bodySchema = z.object({
  startTimeUtc: z.string().datetime(),
  endTimeUtc: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  const limited = checkRateLimit({
    key: `hold:${clientIpFromRequest(req)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid hold request' }, { status: 400 });
  }

  const result = await createHold(parsed.data.startTimeUtc, parsed.data.endTimeUtc);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({
    holdToken: result.holdToken,
    expiresAt: result.expiresAt,
    startTimeUtc: result.startTimeUtc,
    endTimeUtc: result.endTimeUtc,
  });
}

export async function DELETE(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  await releaseHold(token);
  return NextResponse.json({ ok: true });
}
