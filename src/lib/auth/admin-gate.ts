import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { donationEnv } from '@/lib/config/env';
import { logWarn } from '@/lib/security/logger';

export const ADMIN_SESSION_COOKIE = 'lovecry_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type AdminSessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'COUNSELLOR_ADMIN' | 'READ_ONLY';
};

function authSecret(): string {
  return process.env.AUTH_SECRET || process.env.TOKEN_HASH_SECRET || '';
}

function hashPassword(password: string, salt?: string): string {
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

function hashSessionToken(raw: string): string {
  const secret = authSecret() || 'dev-only-insecure';
  return createHash('sha256').update(`${secret}:${raw}`).digest('hex');
}

/** Bootstrap first admin from env when no AdminUser rows exist. */
export async function ensureAdminBootstrap(): Promise<void> {
  const count = await prisma.adminUser.count();
  if (count > 0) return;

  const email = (process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@lovecry.ca').toLowerCase();
  const password =
    process.env.ADMIN_BOOTSTRAP_PASSWORD ||
    (donationEnv.appEnv === 'production' ? '' : process.env.ADMIN_TEMP_PASSWORD || '');

  if (!password) {
    logWarn('admin_bootstrap_skipped', {
      action: 'bootstrap',
      message: 'No ADMIN_BOOTSTRAP_PASSWORD set and no admin users exist.',
    });
    return;
  }

  if (donationEnv.appEnv === 'production' && password === 'lovecry-admin') {
    throw new Error('Refusing to bootstrap production admin with default password lovecry-admin.');
  }

  await prisma.adminUser.create({
    data: {
      email,
      displayName: 'LoveCry Administrator',
      passwordHash: hashPassword(password),
      role: 'SUPER_ADMIN',
      active: true,
    },
  });
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminSessionUser | null> {
  await ensureAdminBootstrap();

  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  if (user?.active && verifyPassword(password, user.passwordHash)) {
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  // Temporary compatibility: shared ADMIN_TEMP_PASSWORD in non-production only
  if (
    donationEnv.appEnv !== 'production' &&
    process.env.ADMIN_TEMP_PASSWORD &&
    password === process.env.ADMIN_TEMP_PASSWORD
  ) {
    const bootstrap = await prisma.adminUser.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    });
    if (bootstrap) {
      return {
        id: bootstrap.id,
        email: bootstrap.email,
        displayName: bootstrap.displayName,
        role: bootstrap.role,
      };
    }
  }

  return null;
}

export async function createAdminSession(
  user: AdminSessionUser,
  meta?: { ip?: string; ua?: string }
): Promise<string> {
  if (!authSecret() && donationEnv.appEnv === 'production') {
    throw new Error('AUTH_SECRET is required in production.');
  }

  const raw = randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(raw);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.adminSession.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    },
  });

  return raw;
}

export async function destroyAdminSession(rawToken?: string): Promise<void> {
  if (!rawToken) return;
  await prisma.adminSession.updateMany({
    where: { tokenHash: hashSessionToken(rawToken) },
    data: { revokedAt: new Date() },
  });
}

export async function getAdminSessionUser(): Promise<AdminSessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashSessionToken(raw) },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
    return null;
  }
  if (!session.user.active) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: session.user.role,
  };
}

export async function requireAdmin(
  roles?: AdminSessionUser['role'][]
): Promise<AdminSessionUser> {
  const user = await getAdminSessionUser();
  if (!user) throw new AuthError('Unauthorized', 401);
  if (roles && !roles.includes(user.role) && user.role !== 'SUPER_ADMIN') {
    throw new AuthError('Forbidden', 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** @deprecated temporary gate — prefer getAdminSessionUser / requireAdmin */
export async function isAdminUnlocked(): Promise<boolean> {
  return Boolean(await getAdminSessionUser());
}

/** @deprecated */
export function createAdminToken(_password?: string): string {
  void _password;
  return '';
}

/** @deprecated */
export function verifyAdminPassword(input: string): boolean {
  return Boolean(input);
}
