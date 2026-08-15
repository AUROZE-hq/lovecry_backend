import { NextResponse } from 'next/server';
import { AuthError, requireAdmin } from '@/lib/auth/admin-gate';
import { getCalendarConnectionStatus } from '@/lib/google/calendar';

export async function GET() {
  try {
    await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'COUNSELLOR_ADMIN', 'READ_ONLY']);
    const status = await getCalendarConnectionStatus();
    return NextResponse.json(status);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Unable to load status' }, { status: 500 });
  }
}
