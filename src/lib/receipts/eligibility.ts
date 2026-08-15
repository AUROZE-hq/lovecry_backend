import { donationEnv } from '@/lib/config/env';

export type ReceiptEligibilityReason =
  | 'ELIGIBLE'
  | 'RECEIPTING_DISABLED'
  | 'PAYMENT_NOT_COMPLETED'
  | 'BELOW_POLICY_THRESHOLD'
  | 'UNSUPPORTED_CURRENCY'
  | 'INELIGIBLE_GIFT';

export function determineReceiptEligibility(input: {
  paymentStatus: string;
  currency: string;
  eligibleAmountCents: number;
  isEligibleGift: boolean;
  receiptingEnabled?: boolean;
}): {
  eligible: boolean;
  reason: ReceiptEligibilityReason;
} {
  const receiptingEnabled = input.receiptingEnabled ?? donationEnv.charity.receiptingEnabled;

  if (!receiptingEnabled) {
    return { eligible: false, reason: 'RECEIPTING_DISABLED' };
  }

  if (input.paymentStatus !== 'PAID') {
    return { eligible: false, reason: 'PAYMENT_NOT_COMPLETED' };
  }

  if (input.currency !== 'CAD') {
    return { eligible: false, reason: 'UNSUPPORTED_CURRENCY' };
  }

  if (!input.isEligibleGift) {
    return { eligible: false, reason: 'INELIGIBLE_GIFT' };
  }

  if (input.eligibleAmountCents < donationEnv.charity.receiptThresholdCents) {
    return { eligible: false, reason: 'BELOW_POLICY_THRESHOLD' };
  }

  return { eligible: true, reason: 'ELIGIBLE' };
}

export function getPublicReceiptPolicyMessage(): string {
  if (!donationEnv.charity.receiptingEnabled) {
    return 'LoveCry will email you a donation acknowledgement. This acknowledgement is not an official charitable tax receipt.';
  }

  const dollars = (donationEnv.charity.receiptThresholdCents / 100).toFixed(0);
  return `Official charitable donation receipts are issued for eligible donations of $${dollars} or more. Donations below $${dollars} will receive an email confirmation but not an official tax receipt.`;
}
