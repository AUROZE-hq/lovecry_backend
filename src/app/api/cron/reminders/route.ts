import { NextResponse } from 'next/server';
import { logInfo } from '@/lib/security/logger';

/**
 * Appointment / consent reminder worker — NOT production-complete.
 *
 * Schema + email templates exist (48h/24h/2h/consent series), but automated
 * scheduling/sending is intentionally incomplete until CRON is configured and
 * reminder rows are generated at booking time.
 *
 * Protect with: Authorization: Bearer $CRON_SECRET
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logInfo('reminders_cron_stub', {
    action: 'reminders',
    status: 'INCOMPLETE',
    message: 'Reminder processing endpoint is stubbed; no emails sent.',
  });

  return NextResponse.json({
    ok: true,
    incomplete: true,
    processed: 0,
    message:
      'Reminder automation is not fully implemented. Booking confirmation and consent emails still send at booking/sign time when Resend is configured.',
  });
}
