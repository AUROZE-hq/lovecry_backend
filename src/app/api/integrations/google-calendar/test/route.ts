import { NextResponse } from 'next/server';
import { AuthError, requirePermission } from '@/lib/auth/permissions';
import { verifyCalendarAccess } from '@/lib/google/calendar';
import { assertSameOrigin } from '@/lib/security/request-guard';

export async function POST(request: Request) {
  try {
    const origin = assertSameOrigin(request);
    if (!origin.ok) {
      return NextResponse.json({ error: origin.error }, { status: origin.status });
    }

    await requirePermission('counselling.google');
    const result = await verifyCalendarAccess();
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: 'Test failed' }, { status: 500 });
  }
}
