import { DEFAULT_CAMPAIGNS } from './campaigns';
import {
  addAudit,
  getDonationById,
  getDonationByReference,
  getReceiptByDonationId,
  listDonations,
  nextReceiptSequence,
  upsertDonation,
  upsertReceipt,
} from './store';
import type { CreateDonationIntentInput, StoredDonation } from './types';
import { determineReceiptEligibility } from '@/lib/receipts/eligibility';
import { donationEnv } from '@/lib/config/env';
import { sendDonationEmails } from '@/lib/email/send';
import { generateReceiptArtifact } from '@/lib/receipts/generate-pdf';
import { createHash } from 'crypto';

function makeReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LC-${stamp}-${rand}`;
}

export async function createDonationIntent(input: CreateDonationIntentInput): Promise<StoredDonation> {
  if (!input.privacyConsent) {
    throw new Error('Privacy consent is required to donate.');
  }

  const campaign =
    DEFAULT_CAMPAIGNS.find((c) => c.slug === input.campaignSlug) ?? DEFAULT_CAMPAIGNS[0];

  const now = new Date().toISOString();
  const donation: StoredDonation = {
    id: crypto.randomUUID(),
    reference: makeReference(),
    zeffyTransactionId: null,
    email: input.email ?? null,
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    amountCents: input.amountCents,
    eligibleReceiptAmountCents: input.amountCents,
    currency: 'CAD',
    frequency: input.frequency,
    campaignSlug: campaign.slug,
    campaignName: campaign.name,
    status: 'PENDING',
    isAnonymous: input.isAnonymous,
    isEligibleGift: true,
    dedicationType: input.dedicationType,
    dedicationName: input.dedicationName ?? null,
    donorMessage: input.donorMessage ?? null,
    marketingConsent: input.marketingConsent,
    transactionDate: null,
    receiptRequired: false,
    receiptStatus: 'NOT_REQUIRED',
    receiptNumber: null,
    confirmationEmailStatus: 'PENDING',
    receiptEmailStatus: 'SKIPPED',
    createdAt: now,
    updatedAt: now,
  };

  await upsertDonation(donation);
  await addAudit({
    action: 'DONATION_INTENT_CREATED',
    entityType: 'Donation',
    entityId: donation.id,
    detail: donation.reference,
  });

  return donation;
}

export async function markDonationPaid(options: {
  donationId?: string;
  reference?: string;
  zeffyTransactionId?: string;
}): Promise<StoredDonation> {
  const donation =
    (options.donationId && (await getDonationById(options.donationId))) ||
    (options.reference && (await getDonationByReference(options.reference)));

  if (!donation) {
    throw new Error('Donation not found.');
  }

  if (donation.status === 'PAID') {
    return donation;
  }

  const now = new Date().toISOString();
  donation.status = 'PAID';
  donation.transactionDate = now;
  donation.zeffyTransactionId = options.zeffyTransactionId ?? donation.zeffyTransactionId;
  donation.updatedAt = now;

  const eligibility = determineReceiptEligibility({
    paymentStatus: 'PAID',
    currency: donation.currency,
    eligibleAmountCents: donation.eligibleReceiptAmountCents,
    isEligibleGift: donation.isEligibleGift,
  });

  donation.receiptRequired = eligibility.eligible;
  donation.receiptStatus = eligibility.eligible ? 'PENDING' : 'NOT_REQUIRED';

  await upsertDonation(donation);
  await addAudit({
    action: 'DONATION_MARKED_PAID',
    entityType: 'Donation',
    entityId: donation.id,
    detail: eligibility.reason,
  });

  const emailResult = await sendDonationEmails(donation, eligibility.eligible);
  donation.confirmationEmailStatus = emailResult.confirmationStatus;
  donation.receiptEmailStatus = emailResult.receiptStatus;
  donation.updatedAt = new Date().toISOString();
  await upsertDonation(donation);

  if (eligibility.eligible) {
    await issueOfficialReceipt(donation);
  }

  return (await getDonationById(donation.id))!;
}

async function issueOfficialReceipt(donation: StoredDonation): Promise<void> {
  const existing = await getReceiptByDonationId(donation.id);
  if (existing) return;

  const year = new Date().getFullYear();
  const seq = await nextReceiptSequence(year);
  const receiptNumber = `LC-${year}-${String(seq).padStart(6, '0')}`;

  const artifact = await generateReceiptArtifact({
    receiptNumber,
    donation,
    charityName: donationEnv.charity.legalName || 'LoveCry The Street Kids Organization',
    registrationNumber: donationEnv.charity.registrationNumber || '',
    charityAddress: donationEnv.charity.address || '',
  });

  const receiptId = crypto.randomUUID();
  const issuedAt = new Date().toISOString();

  await upsertReceipt({
    id: receiptId,
    donationId: donation.id,
    receiptNumber,
    type: 'OFFICIAL',
    status: 'GENERATED',
    eligibleAmountCents: donation.eligibleReceiptAmountCents,
    issuedAt,
    emailedAt: null,
    pdfPath: artifact.path,
    checksum: artifact.checksum,
  });

  donation.receiptNumber = receiptNumber;
  donation.receiptStatus = 'GENERATED';
  donation.updatedAt = issuedAt;
  await upsertDonation(donation);

  await addAudit({
    action: 'RECEIPT_GENERATED',
    entityType: 'DonationReceipt',
    entityId: receiptId,
    detail: receiptNumber,
  });
}

export async function getDonationStatus(reference: string) {
  const donation = await getDonationByReference(reference);
  if (!donation) return null;

  const eligibility = determineReceiptEligibility({
    paymentStatus: donation.status,
    currency: donation.currency,
    eligibleAmountCents: donation.eligibleReceiptAmountCents,
    isEligibleGift: donation.isEligibleGift,
  });

  return {
    donation,
    receipt: (await getReceiptByDonationId(donation.id)) ?? null,
    eligibility,
  };
}

export async function getAdminDonationStats() {
  const donations = await listDonations();
  const paid = donations.filter((d) => d.status === 'PAID');
  const raisedCents = paid.reduce((sum, d) => sum + d.amountCents, 0);
  const receiptsIssued = paid.filter(
    (d) => d.receiptStatus === 'GENERATED' || d.receiptStatus === 'EMAILED'
  ).length;
  const belowThreshold = paid.filter(
    (d) => d.eligibleReceiptAmountCents < donationEnv.charity.receiptThresholdCents
  ).length;

  return {
    totalDonations: donations.length,
    paidCount: paid.length,
    raisedCents,
    receiptsIssued,
    belowThreshold,
    pending: donations.filter((d) => d.status === 'PENDING').length,
  };
}

export function syncHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
