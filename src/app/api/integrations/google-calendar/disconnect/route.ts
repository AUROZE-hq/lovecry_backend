import { NextResponse } from 'next/server';
import { AuthError, requirePermission } from '@/lib/auth/permissions';
import { disconnectGoogleCalendar } from '@/lib/google/calendar';
import { assertSameOrigin } from '@/lib/security/request-guard';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const origin = assertSameOrigin(request);
    if (!origin.ok) {
      return NextResponse.json({ error: origin.error }, { status: origin.status });
    }

    const admin = await requirePermission('counselling.google');
    await disconnectGoogleCalendar(admin.id);
    await prisma.auditLog.create({
      data: {
        administratorId: admin.id,
        action: 'GOOGLE_CALENDAR_DISCONNECTED',
        entityType: 'GoogleCalendarIntegration',
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Disconnect failed' }, { status: 500 });
  }
}
