import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSlotsForDate, listAvailableDates } from '@/lib/counselling/availability';
import { checkRateLimit, clientIpFromRequest } from '@/lib/security/rate-limit';

export async function GET(req: NextRequest) {
  const limited = checkRateLimit({
    key: `availability:${clientIpFromRequest(req)}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } }
    );
  }

  const date = req.nextUrl.searchParams.get('date');
  if (!date) {
    const dates = await listAvailableDates();
    return NextResponse.json({ dates });
  }

  const parsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(date);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  const slots = await generateSlotsForDate(parsed.data);
  return NextResponse.json({ date: parsed.data, slots });
}
