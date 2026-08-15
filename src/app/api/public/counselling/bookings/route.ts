import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createBooking, getPublicBookingSummary } from '@/lib/counselling/service';
import { checkRateLimit, clientIpFromRequest } from '@/lib/security/rate-limit';

const schema = z.object({
  holdToken: z.string().min(10),
  serviceId: z.string().min(1),
  appointmentMode: z.enum(['VIRTUAL', 'PHONE', 'IN_PERSON']),
  client: z.object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    email: z.string().email(),
    phone: z.string().min(7).max(30),
    preferredContactMethod: z.enum(['EMAIL', 'PHONE', 'SMS']).optional(),
    preferredLanguage: z.string().max(40).optional(),
    safeToLeaveVoicemail: z.boolean(),
    safeToSendEmail: z.boolean(),
    accessibilityRequirements: z.string().max(500).optional(),
    emergencyContactName: z.string().max(80).optional(),
    emergencyContactPhone: z.string().max(30).optional(),
    emergencyRelationship: z.string().max(60).optional(),
    referralSource: z.string().max(120).optional(),
    firstSession: z.boolean().optional(),
  }),
  intakeAnswers: z.record(z.string(), z.union([z.string(), z.boolean()])),
  clientNotes: z.string().max(1000).optional(),
  idempotencyKey: z.string().min(8).max(120).optional(),
  signature: z
    .object({
      legalName: z.string().min(2),
      method: z.enum(['DRAWN', 'TYPED', 'DRAWN_AND_TYPED']),
      signatureDataUrl: z.string().max(500_000).optional(),
      acknowledgements: z.array(z.string()).min(3),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const limited = checkRateLimit({
    key: `booking:${clientIpFromRequest(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid booking details', details: parsed.error.flatten() }, { status: 400 });
  }

  const idempotencyKey =
    parsed.data.idempotencyKey || req.headers.get('idempotency-key') || undefined;

  const result = await createBooking({ ...parsed.data, idempotencyKey });
  if (!result.ok) {
    const status =
      result.code === 'SYNC_FAILED'
        ? 502
        : result.code === 'UNAVAILABLE'
          ? 503
          : result.code === 'VALIDATION'
            ? 400
            : 409;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    ok: true,
    manageToken: result.manageToken,
    consentToken: result.consentToken,
    summary: await getPublicBookingSummary(result.appointment, {
      manageToken: result.manageToken,
      consentToken: result.consentToken,
    }),
  });
}
