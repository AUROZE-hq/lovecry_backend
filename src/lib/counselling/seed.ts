import { counsellingEnv } from '@/lib/config/counselling-env';
import { prisma } from '@/lib/db/prisma';
import { sha256 } from './tokens';

const DEFAULT_CONSENT_BODY = `
LoveCry Counselling Consent Form

By signing this form, you acknowledge that you understand the nature of counselling services provided by LoveCry The Street Kids Organization.

1. Confidentiality: What you share in counselling is confidential, with legal exceptions (e.g. risk of harm, child protection, court orders).
2. Voluntary participation: You may stop counselling at any time.
3. Records: LoveCry keeps appointment and consent records securely.
4. Virtual sessions: If meeting online, you agree to join from a private space and use a secure connection when possible.
5. Emergency: LoveCry booking is not a crisis service. Call 911 or go to the nearest emergency department if you are in immediate danger.

Full legal templates may be uploaded by administrators as PDF versions. This text version is used until a PDF template is configured.
`.trim();

const g = globalThis as unknown as { __lovecrySeedPromise?: Promise<void> };

/** Idempotent seed of default counsellor, service, windows, settings, consent template. */
export async function ensureCounsellingSeeded(): Promise<void> {
  if (!g.__lovecrySeedPromise) {
    g.__lovecrySeedPromise = seedOnce().catch((err) => {
      g.__lovecrySeedPromise = undefined;
      throw err;
    });
  }
  await g.__lovecrySeedPromise;
}

async function seedOnce(): Promise<void> {
  const crisis =
    counsellingEnv.crisisMessage ||
    "LoveCry's online booking service is not an emergency or crisis service. If you are in immediate danger, call 911 or go to the nearest emergency department.";

  await prisma.bookingSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      timeZone: counsellingEnv.timeZone,
      durationMinutes: counsellingEnv.durationMinutes,
      bufferBeforeMinutes: counsellingEnv.bufferBeforeMinutes,
      bufferAfterMinutes: counsellingEnv.bufferAfterMinutes,
      minimumNoticeHours: counsellingEnv.minimumNoticeHours,
      maximumWindowDays: counsellingEnv.maximumWindowDays,
      holdMinutes: counsellingEnv.holdMinutes,
      consentDeadlineHours: counsellingEnv.consentDeadlineHours,
      consentRequiredBeforeConfirm: counsellingEnv.consentRequiredBeforeConfirm,
      googleMeetEnabled: true,
      maxAppointmentsPerDay: 8,
      inPersonLocation:
        counsellingEnv.inPersonLocation ||
        'In-person location to be confirmed with LoveCry staff',
      crisisMessage: crisis,
    },
    update: {},
  });

  const counsellor = await prisma.counsellor.upsert({
    where: { email: 'counselling@lovecry.ca' },
    create: {
      id: 'counsellor-default',
      displayName: 'LoveCry Counsellor',
      email: 'counselling@lovecry.ca',
      timeZone: counsellingEnv.timeZone,
      active: true,
      googleCalendarId: counsellingEnv.google.counsellingCalendarId || null,
      defaultDurationMinutes: counsellingEnv.durationMinutes,
      bufferBeforeMinutes: counsellingEnv.bufferBeforeMinutes,
      bufferAfterMinutes: counsellingEnv.bufferAfterMinutes,
    },
    update: {
      active: true,
      googleCalendarId: counsellingEnv.google.counsellingCalendarId || undefined,
    },
  });

  await prisma.counsellingService.upsert({
    where: { slug: 'individual-counselling' },
    create: {
      id: 'svc-individual',
      name: 'Individual counselling session',
      slug: 'individual-counselling',
      description: 'One-hour individual counselling session with a LoveCry counsellor.',
      durationMinutes: 60,
      active: true,
    },
    update: { active: true },
  });

  const ruleCount = await prisma.availabilityRule.count({
    where: { counsellorId: counsellor.id },
  });
  if (ruleCount === 0) {
    const days = [1, 2, 3, 4, 5];
    for (const weekday of days) {
      await prisma.availabilityRule.createMany({
        data: [
          {
            counsellorId: counsellor.id,
            weekday,
            startMinutesFromMidnight: 9 * 60,
            endMinutesFromMidnight: 12 * 60,
            active: true,
          },
          {
            counsellorId: counsellor.id,
            weekday,
            startMinutesFromMidnight: 13 * 60,
            endMinutesFromMidnight: 17 * 60,
            active: true,
          },
        ],
      });
    }
  }

  const activeTemplate = await prisma.consentTemplate.findFirst({
    where: { status: 'ACTIVE' },
  });
  if (!activeTemplate) {
    const body = DEFAULT_CONSENT_BODY;
    await prisma.consentTemplate.create({
      data: {
        id: 'consent-v1',
        title: 'LoveCry Counselling Consent',
        version: '1.0',
        status: 'ACTIVE',
        documentHash: sha256(body),
        bodyText: body,
        effectiveAt: new Date(),
      },
    });
  }
}
