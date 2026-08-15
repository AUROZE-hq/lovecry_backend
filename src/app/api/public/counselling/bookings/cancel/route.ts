import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cancelBooking, getPublicBookingSummary } from '@/lib/counselling/service';

const cancelSchema = z.object({
  manageToken: z.string().min(10),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = cancelSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const result = await cancelBooking(parsed.data.manageToken, parsed.data.reason, 'CLIENT');
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({
    ok: true,
    summary: await getPublicBookingSummary(result.appointment),
  });
}
