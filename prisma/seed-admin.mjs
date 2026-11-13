// Idempotent: creates the bootstrap SUPER_ADMIN if missing. Never overwrites an existing password.
import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const email = (process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@lovecry.ca').toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || '';

if (!password) {
  console.warn('seed-admin: ADMIN_BOOTSTRAP_PASSWORD not set, skipping.');
  process.exit(0);
}
if (password === 'lovecry-admin' && process.env.APP_ENV === 'production') {
  console.error('seed-admin: refusing default password in production.');
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`seed-admin: ${email} already exists, leaving unchanged.`);
  } else {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    await prisma.adminUser.create({
      data: {
        email,
        displayName: 'LoveCry Administrator',
        passwordHash: `scrypt:${salt}:${hash}`,
        role: 'SUPER_ADMIN',
        active: true,
      },
    });
    console.log(`seed-admin: created ${email}.`);
  }
} finally {
  await prisma.$disconnect();
}
