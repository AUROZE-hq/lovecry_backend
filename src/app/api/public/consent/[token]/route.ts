import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActiveConsentTemplate, upsertAppointment, addAudit } from '@/lib/counselling/store';
import {
  getPublicBookingSummary,
  resolveConsentOrManageToken,
  signConsentWithToken,
} from '@/lib/counselling/service';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const appt = await resolveConsentOrManageToken(token);
  if (!appt) return NextResponse.json({ error: 'Invalid or expired signing link' }, { status: 404 });

  const template = await getActiveConsentTemplate();
  if (appt.consentStatus !== 'SIGNED' && appt.consentStatus !== 'VIEWED') {
    appt.consentStatus = 'VIEWED';
    await upsertAppointment(appt);
    await addAudit({
      appointmentId: appt.id,
      actorType: 'CLIENT',
      action: 'CONSENT_VIEWED',
    });
  }

  return NextResponse.json({
    summary: await getPublicBookingSummary(appt),
    alreadySigned: appt.consentStatus === 'SIGNED',
    consent: template
      ? { title: template.title, version: template.version, bodyText: template.bodyText }
      : null,
  });
}

const signSchema = z.object({
  legalName: z.string().min(2).max(120),
  method: z.enum(['DRAWN', 'TYPED', 'DRAWN_AND_TYPED']),
  signatureDataUrl: z.string().max(500_000).optional(),
  acknowledgements: z.array(z.string()).min(3),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = signSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid signature payload' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ua = req.headers.get('user-agent') || undefined;
  const result = await signConsentWithToken(token, parsed.data, ip, ua);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
