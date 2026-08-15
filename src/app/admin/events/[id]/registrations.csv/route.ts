import { NextResponse } from 'next/server';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { EventServiceError, exportRegistrationsCsv } from '@/lib/events/service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUnlocked())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const csv = await exportRegistrationsCsv(id);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="event-${id}-registrations.csv"`,
      },
    });
  } catch (err) {
    const status = err instanceof EventServiceError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Export failed' },
      { status }
    );
  }
}
