import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { donationEnv } from '@/lib/config/env';
import { deliverEmail } from '@/lib/email/send';
import { orgInfo } from '@/lib/org-info';
import { logInfo, logWarn } from '@/lib/security/logger';

export const DONOR_SESSION_COOKIE = 'lovecry_donor_session';
/** @deprecated Removed from authorization; kept only to clear old cookies. */
export const DONOR_COOKIE = 'lovecry_donor_email';

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const AUTH_TOKEN_TTL_MS = 60 * 60 * 1000;

export type AuthenticatedDonor = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  portalActivatedAt: Date | null;
};

function authSecret(): string {
  return process.env.AUTH_SECRET || process.env.TOKEN_HASH_SECRET || '';
}

export function hashPassword(password: string, salt?: string): string {
  const s = salt || randomBytes(16).toString('hex');
  const hash = scryptSync(password, s, 64).toString('hex');
  return `scrypt:${s}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, salt, hash] = stored.split(':');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, 'hex');
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

function hashOpaqueToken(raw: string): string {
  const secret = authSecret() || 'dev-only-insecure';
  return createHash('sha256').update(`${secret}:${raw}`).digest('hex');
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function createDonorSession(
  donorId: string,
  meta?: { ip?: string; ua?: string }
): Promise<string> {
  const raw = createOpaqueToken();
  const tokenHash = hashOpaqueToken(raw);
  await prisma.donorSession.create({
    data: {
      donorId,
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ipAddress: meta?.ip?.slice(0, 64) || null,
      userAgent: meta?.ua?.slice(0, 500) || null,
    },
  });
  return raw;
}

export async function setDonorSessionCookie(rawToken: string): Promise<void> {
  const jar = await cookies();
  jar.set(DONOR_SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  // Clear legacy insecure email cookie if present
  jar.delete(DONOR_COOKIE);
}

export async function clearDonorSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(DONOR_SESSION_COOKIE);
  jar.delete(DONOR_COOKIE);
}

export async function getAuthenticatedDonor(): Promise<AuthenticatedDonor | null> {
  const jar = await cookies();
  const raw = jar.get(DONOR_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const tokenHash = hashOpaqueToken(raw);
  const session = await prisma.donorSession.findUnique({
    where: { tokenHash },
    include: {
      donor: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          portalActivatedAt: true,
          passwordHash: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
    return null;
  }

  if (!session.donor.passwordHash && !session.donor.portalActivatedAt) {
    return null;
  }

  return {
    id: session.donor.id,
    email: session.donor.email,
    firstName: session.donor.firstName,
    lastName: session.donor.lastName,
    portalActivatedAt: session.donor.portalActivatedAt,
  };
}

export async function requireAuthenticatedDonor(): Promise<AuthenticatedDonor> {
  const donor = await getAuthenticatedDonor();
  if (!donor) {
    throw new DonorAuthError('Authentication required', 401);
  }
  return donor;
}

export class DonorAuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function revokeDonorSession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(DONOR_SESSION_COOKIE)?.value;
  if (raw) {
    const tokenHash = hashOpaqueToken(raw);
    await prisma.donorSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  await clearDonorSessionCookie();
}

async function findOrCreateDonorByEmail(input: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}): Promise<{ id: string; email: string; passwordHash: string | null; portalActivatedAt: Date | null }> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.donor.findFirst({
    where: { email },
    orderBy: [{ portalActivatedAt: 'desc' }, { createdAt: 'asc' }],
  });
  if (existing) {
    if (input.firstName || input.lastName) {
      await prisma.donor.update({
        where: { id: existing.id },
        data: {
          firstName: input.firstName || existing.firstName,
          lastName: input.lastName || existing.lastName,
        },
      });
    }
    return existing;
  }
  return prisma.donor.create({
    data: {
      email,
      firstName: input.firstName || null,
      lastName: input.lastName || null,
    },
  });
}

export async function activateDonorPortalWithPassword(input: {
  email: string;
  password: string;
  donationReference?: string | null;
  meta?: { ip?: string; ua?: string };
}): Promise<{ donor: AuthenticatedDonor; alreadyExisted: boolean }> {
  if (input.password.length < 8) {
    throw new DonorAuthError('Password must be at least 8 characters.');
  }

  const email = input.email.trim().toLowerCase();
  let donationId: string | null = null;
  if (input.donationReference) {
    const donation = await prisma.donation.findFirst({
      where: {
        OR: [{ localReference: input.donationReference }, { id: input.donationReference }],
        status: 'PAID',
      },
      include: { donor: true },
    });
    if (!donation) throw new DonorAuthError('Donation not found or not completed.', 404);
    if (donation.donor?.email && donation.donor.email.toLowerCase() !== email) {
      throw new DonorAuthError('Use the same email from your donation.', 403);
    }
    donationId = donation.id;
    if (!donation.donorId && donation.donor === null) {
      // link will happen after donor resolve
    }
  }

  const donor = await findOrCreateDonorByEmail({ email });
  const alreadyExisted = Boolean(donor.passwordHash && donor.portalActivatedAt);

  if (alreadyExisted) {
    if (!verifyPassword(input.password, donor.passwordHash!)) {
      throw new DonorAuthError('Incorrect password for this donor account.', 401);
    }
  } else {
    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        passwordHash: hashPassword(input.password),
        portalActivatedAt: new Date(),
      },
    });
  }

  if (donationId) {
    await prisma.donation.updateMany({
      where: { id: donationId, OR: [{ donorId: null }, { donorId: donor.id }] },
      data: { donorId: donor.id },
    });
  }

  // Also attach any PAID donations for this email that lack donorId or match this donor
  await prisma.donation.updateMany({
    where: {
      status: 'PAID',
      donorId: null,
      donor: { email },
    },
    data: { donorId: donor.id },
  });

  const raw = await createDonorSession(donor.id, input.meta);
  await setDonorSessionCookie(raw);

  const refreshed = await prisma.donor.findUniqueOrThrow({ where: { id: donor.id } });
  logInfo('donor_portal_activated', {
    action: alreadyExisted ? 'sign_in' : 'activate',
    status: 'ok',
  });

  return {
    alreadyExisted,
    donor: {
      id: refreshed.id,
      email: refreshed.email,
      firstName: refreshed.firstName,
      lastName: refreshed.lastName,
      portalActivatedAt: refreshed.portalActivatedAt,
    },
  };
}

export async function signInDonorWithPassword(input: {
  email: string;
  password: string;
  meta?: { ip?: string; ua?: string };
}): Promise<AuthenticatedDonor> {
  const email = input.email.trim().toLowerCase();
  const donor = await prisma.donor.findFirst({
    where: { email, passwordHash: { not: null }, portalActivatedAt: { not: null } },
    orderBy: { portalActivatedAt: 'desc' },
  });
  if (!donor?.passwordHash || !verifyPassword(input.password, donor.passwordHash)) {
    throw new DonorAuthError('Invalid email or password.', 401);
  }
  const raw = await createDonorSession(donor.id, input.meta);
  await setDonorSessionCookie(raw);
  return {
    id: donor.id,
    email: donor.email,
    firstName: donor.firstName,
    lastName: donor.lastName,
    portalActivatedAt: donor.portalActivatedAt,
  };
}

export async function issueDonorMagicLink(input: {
  email: string;
  purpose: 'ACTIVATION' | 'MAGIC_LINK';
  donationReference?: string | null;
}): Promise<{ sent: boolean; previewUrl?: string }> {
  const email = input.email.trim().toLowerCase();
  const donor = await findOrCreateDonorByEmail({ email });

  let donationId: string | null = null;
  if (input.donationReference) {
    const donation = await prisma.donation.findFirst({
      where: {
        OR: [{ localReference: input.donationReference }, { id: input.donationReference }],
        status: 'PAID',
      },
      include: { donor: true },
    });
    if (donation) {
      if (donation.donor?.email && donation.donor.email.toLowerCase() !== email) {
        throw new DonorAuthError('Use the same email from your donation.', 403);
      }
      donationId = donation.id;
    }
  }

  const raw = createOpaqueToken();
  await prisma.donorAuthToken.create({
    data: {
      donorId: donor.id,
      email,
      purpose: input.purpose,
      tokenHash: hashOpaqueToken(raw),
      donationId,
      expiresAt: new Date(Date.now() + AUTH_TOKEN_TTL_MS),
    },
  });

  const site = donationEnv.siteUrl.replace(/\/$/, '');
  const url = `${site}/donor/auth/verify?token=${encodeURIComponent(raw)}`;

  const status = await deliverEmail({
    to: email,
    subject: 'Your LoveCry Donor Portal sign-in link',
    text: [
      'Hi,',
      '',
      'Use this secure link to access your LoveCry Donor Portal:',
      url,
      '',
      'This link expires in 1 hour and can only be used once.',
      '',
      `${orgInfo.shortName} — ${orgInfo.websiteHref}`,
    ].join('\n'),
    html: `<p>Use this secure link to access your LoveCry Donor Portal:</p><p><a href="${url}">${url}</a></p><p>This link expires in 1 hour and can only be used once.</p>`,
  });

  logInfo('donor_magic_link_issued', {
    action: 'magic_link',
    status: status,
  });

  return {
    sent: status === 'SENT' || status === 'SKIPPED',
    previewUrl: donationEnv.appEnv === 'development' ? url : undefined,
  };
}

export async function consumeDonorAuthToken(
  rawToken: string,
  meta?: { ip?: string; ua?: string }
): Promise<AuthenticatedDonor> {
  const tokenHash = hashOpaqueToken(rawToken);
  const row = await prisma.donorAuthToken.findUnique({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    throw new DonorAuthError('This sign-in link is invalid or has expired.', 400);
  }

  await prisma.donorAuthToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });

  let donorId = row.donorId;
  if (!donorId) {
    const created = await findOrCreateDonorByEmail({ email: row.email });
    donorId = created.id;
  }

  await prisma.donor.update({
    where: { id: donorId },
    data: {
      portalActivatedAt: new Date(),
      // Magic-link activation without password still marks portal active;
      // password can be set later from profile.
    },
  });

  if (row.donationId) {
    await prisma.donation.updateMany({
      where: { id: row.donationId },
      data: { donorId },
    });
  }

  await prisma.donation.updateMany({
    where: {
      status: 'PAID',
      donorId: null,
      donor: { email: row.email.toLowerCase() },
    },
    data: { donorId },
  });

  const raw = await createDonorSession(donorId, meta);
  await setDonorSessionCookie(raw);

  const donor = await prisma.donor.findUniqueOrThrow({ where: { id: donorId } });
  return {
    id: donor.id,
    email: donor.email,
    firstName: donor.firstName,
    lastName: donor.lastName,
    portalActivatedAt: donor.portalActivatedAt,
  };
}

export async function donorHasPortalAccount(email: string): Promise<boolean> {
  const row = await prisma.donor.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      portalActivatedAt: { not: null },
      passwordHash: { not: null },
    },
  });
  return Boolean(row);
}

/** @deprecated — do not use for authorization */
export async function getDonorEmailFromCookies(
  getCookie: (name: string) => { value: string } | undefined
): Promise<string | null> {
  logWarn('deprecated_donor_email_cookie_read', {
    action: 'auth',
    message: 'Legacy email cookie is not used for authorization.',
  });
  return getCookie(DONOR_COOKIE)?.value ?? null;
}
