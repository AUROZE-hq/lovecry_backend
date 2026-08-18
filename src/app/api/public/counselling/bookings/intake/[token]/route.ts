import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getIntakeForManageToken, saveIntakeAnswers } from '@/lib/counselling/service';
import { checkRateLimit, clientIpFromRequest } from '@/lib/security/rate-limit';

type Ctx = { params: Promise<{ token: string }> };

const intakeSchema = z.object({
  supportWith: z.string().max(2000).optional(),
  interpreter: z.boolean().optional(),
  accessibility: z.string().max(500).optional(),
  firstSession: z.boolean().optional(),
});

export async function GET(req: NextRequest, ctx: Ctx) {
  const limited = checkRateLimit({
    key: `intake-get:${clientIpFromRequest(req)}`,
    limit: 40,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } }
    );
  }

  const { token } = await ctx.params;
  const result = await getIntakeForManageToken(token);
  if (!result.ok) {
    const status = result.code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    intakeAnswers: result.intakeAnswers,
    summary: result.summary,
  });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const limited = checkRateLimit({
    key: `intake-put:${clientIpFromRequest(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } }
    );
  }

  const { token } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = intakeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid intake details' }, { status: 400 });
  }

  const result = await saveIntakeAnswers(token, parsed.data);
  if (!result.ok) {
    const status = result.code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, intakeAnswers: result.intakeAnswers });
}
