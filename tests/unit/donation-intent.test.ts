import { describe, expect, it } from 'vitest';
import { CreateDonationIntentSchema } from '@/lib/donations/types';

describe('donation intent validation', () => {
  it('requires donor identity fields for guest checkout', () => {
    const parsed = CreateDonationIntentSchema.safeParse({
      amountCents: 5000,
      frequency: 'ONE_TIME',
      campaignSlug: 'where-needed-most',
      privacyConsent: true,
    });
    expect(parsed.success).toBe(false);
  });

  it('requires dedication name when dedication is selected', () => {
    const parsed = CreateDonationIntentSchema.safeParse({
      email: 'jey@example.com',
      firstName: 'Jey',
      lastName: 'Siva',
      amountCents: 5000,
      frequency: 'ONE_TIME',
      campaignSlug: 'where-needed-most',
      dedicationType: 'IN_HONOUR',
      privacyConsent: true,
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts a valid guest donation intent', () => {
    const parsed = CreateDonationIntentSchema.safeParse({
      email: 'jey@example.com',
      firstName: 'Jey',
      lastName: 'Siva',
      amountCents: 5000,
      frequency: 'ONE_TIME',
      campaignSlug: 'where-needed-most',
      privacyConsent: true,
      idempotencyKey: 'test-key-12345678',
    });
    expect(parsed.success).toBe(true);
  });
});
