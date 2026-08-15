import { NextRequest, NextResponse } from 'next/server';
import { getPublicBookingSummary, resolveManageToken } from '@/lib/counselling/service';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const appt = await resolveManageToken(token);
  if (!appt) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }
  return NextResponse.json({
    summary: await getPublicBookingSummary(appt, { manageToken: token }),
    client: {
      firstName: appt.client.firstName,
      safeToLeaveVoicemail: appt.client.safeToLeaveVoicemail,
      safeToSendEmail: appt.client.safeToSendEmail,
    },
  });
}
