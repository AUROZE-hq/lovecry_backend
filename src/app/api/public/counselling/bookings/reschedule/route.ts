import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPublicBookingSummary, rescheduleBooking } from '@/lib/counselling/service';

const schema = z.object({
  manageToken: z.string().min(10),
  holdToken: z.string().min(10),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const result = await rescheduleBooking(parsed.data.manageToken, parsed.data.holdToken, 'CLIENT');
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({
    ok: true,
    summary: await getPublicBookingSummary(result.appointment, {
      manageToken: parsed.data.manageToken,
    }),
  });
}
