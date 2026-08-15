import { ZEFFY_EMBED_ALLOWLIST, isAllowedZeffyEmbedUrl } from '@/lib/config/zeffy-allowlist';

export { ZEFFY_EMBED_ALLOWLIST, isAllowedZeffyEmbedUrl };

/**
 * Donation platform environment configuration.
 * Hostinger: set DATABASE_URL to your MySQL connection string.
 */

export type AppEnv = 'development' | 'production' | 'test';

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

function readInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const donationEnv = {
  appEnv: (process.env.APP_ENV as AppEnv) || 'development',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  databaseUrl: process.env.DATABASE_URL || '',

  /** @deprecated temporary gate — prefer AdminUser sessions */
  adminPassword: process.env.ADMIN_TEMP_PASSWORD || '',
  adminCookieName: 'lovecry_admin_session',

  allowMockPay: readBoolean(process.env.ALLOW_MOCK_PAY, false),

  zeffy: {
    apiKey: process.env.ZEFFY_API_KEY || '',
    organizationId: process.env.ZEFFY_ORGANIZATION_ID || '',
    apiBaseUrl: process.env.ZEFFY_API_BASE_URL || 'https://api.zeffy.com',
    defaultCampaignId: process.env.ZEFFY_DEFAULT_CAMPAIGN_ID || '',
    defaultEmbedUrl: process.env.ZEFFY_DEFAULT_EMBED_URL || '',
    syncEnabled: readBoolean(process.env.ZEFFY_SYNC_ENABLED, false),
  },

  charity: {
    receiptingEnabled: readBoolean(process.env.CHARITY_RECEIPTING_ENABLED, false),
    legalName: process.env.CHARITY_LEGAL_NAME || '',
    registrationNumber: process.env.CHARITY_REGISTRATION_NUMBER || '',
    address: process.env.CHARITY_ADDRESS || '',
    issuanceLocation: process.env.CHARITY_ISSUANCE_LOCATION || 'Toronto, Ontario',
    authorizedSignatory: process.env.CHARITY_AUTHORIZED_SIGNATORY || '',
    receiptThresholdCents: readInt(process.env.CHARITY_RECEIPT_THRESHOLD_CENTS, 2000),
  },

  email: {
    from: process.env.EMAIL_FROM || '',
    replyTo: process.env.EMAIL_REPLY_TO || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
  },
} as const;

export function isZeffyConfigured(): boolean {
  return Boolean(
    donationEnv.zeffy.apiKey &&
      donationEnv.zeffy.organizationId &&
      donationEnv.zeffy.defaultEmbedUrl
  );
}

export function isMockPayAllowed(): boolean {
  if (donationEnv.appEnv === 'production' || process.env.NODE_ENV === 'production') {
    return false;
  }
  return donationEnv.allowMockPay;
}
