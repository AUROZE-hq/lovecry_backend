import assert from 'node:assert/strict';

const THRESHOLD = 2000;

function determineReceiptEligibility(input) {
  if (!input.receiptingEnabled) {
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
  if (input.eligibleAmountCents < THRESHOLD) {
    return { eligible: false, reason: 'BELOW_POLICY_THRESHOLD' };
  }
  return { eligible: true, reason: 'ELIGIBLE' };
}

const base = {
  paymentStatus: 'PAID',
  currency: 'CAD',
  isEligibleGift: true,
  receiptingEnabled: true,
};

assert.equal(
  determineReceiptEligibility({ ...base, eligibleAmountCents: 1999 }).reason,
  'BELOW_POLICY_THRESHOLD'
);
assert.equal(determineReceiptEligibility({ ...base, eligibleAmountCents: 2000 }).eligible, true);
assert.equal(
  determineReceiptEligibility({
    ...base,
    eligibleAmountCents: 10000,
    receiptingEnabled: false,
  }).reason,
  'RECEIPTING_DISABLED'
);
assert.equal(
  determineReceiptEligibility({
    ...base,
    paymentStatus: 'PENDING',
    eligibleAmountCents: 5000,
  }).reason,
  'PAYMENT_NOT_COMPLETED'
);

console.log('eligibility tests passed');
