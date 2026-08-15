import type { StoredDonation, StoredReceipt, AuditEntry } from './types';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

/**
 * Prisma-backed donation persistence (MySQL).
 */

export async function listDonations(): Promise<StoredDonation[]> {
  await ensureCampaignSeed();
  const rows = await prisma.donation.findMany({
    include: { donor: true, campaign: true, receipt: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapDonation);
}

export async function getDonationById(id: string): Promise<StoredDonation | undefined> {
  const row = await prisma.donation.findUnique({
    where: { id },
    include: { donor: true, campaign: true, receipt: true },
  });
  return row ? mapDonation(row) : undefined;
}

export async function getDonationByReference(reference: string): Promise<StoredDonation | undefined> {
  const row = await prisma.donation.findFirst({
    where: {
      OR: [{ id: reference }, { localReference: reference }, { zeffyTransactionId: reference }],
    },
    include: { donor: true, campaign: true, receipt: true },
  });
  return row ? mapDonation(row) : undefined;
}

export async function upsertDonation(donation: StoredDonation): Promise<StoredDonation> {
  await ensureCampaignSeed();
  const campaign = await prisma.campaign.findUnique({ where: { slug: donation.campaignSlug } });

  let donorId: string | undefined;
  if (donation.email) {
    const existing = await prisma.donor.findFirst({ where: { email: donation.email.toLowerCase() } });
    if (existing) {
      donorId = existing.id;
      await prisma.donor.update({
        where: { id: existing.id },
        data: {
          firstName: donation.firstName,
          lastName: donation.lastName,
          marketingConsent: donation.marketingConsent,
        },
      });
    } else {
      const created = await prisma.donor.create({
        data: {
          email: donation.email.toLowerCase(),
          firstName: donation.firstName,
          lastName: donation.lastName,
          marketingConsent: donation.marketingConsent,
          anonymousPreference: donation.isAnonymous,
        },
      });
      donorId = created.id;
    }
  }

  const meta = {
    reference: donation.reference,
    marketingConsent: donation.marketingConsent,
    receiptEmailStatus: donation.receiptEmailStatus,
    receiptNumber: donation.receiptNumber,
  };

  const row = await prisma.donation.upsert({
    where: { id: donation.id },
    create: {
      id: donation.id,
      localReference: donation.reference,
      zeffyTransactionId: donation.zeffyTransactionId,
      donorId,
      campaignId: campaign?.id,
      amountCents: donation.amountCents,
      eligibleReceiptAmountCents: donation.eligibleReceiptAmountCents,
      currency: donation.currency,
      frequency: donation.frequency,
      status: donation.status,
      isAnonymous: donation.isAnonymous,
      isEligibleGift: donation.isEligibleGift,
      dedicationType: donation.dedicationType,
      dedicationName: donation.dedicationName,
      donorMessage: donation.donorMessage,
      transactionDate: donation.transactionDate ? new Date(donation.transactionDate) : null,
      receiptRequired: donation.receiptRequired,
      receiptStatus: donation.receiptStatus,
      confirmationEmailStatus: donation.confirmationEmailStatus,
      rawProviderMetadata: meta,
    },
    update: {
      localReference: donation.reference,
      zeffyTransactionId: donation.zeffyTransactionId,
      donorId,
      campaignId: campaign?.id,
      amountCents: donation.amountCents,
      eligibleReceiptAmountCents: donation.eligibleReceiptAmountCents,
      status: donation.status,
      isAnonymous: donation.isAnonymous,
      dedicationType: donation.dedicationType,
      dedicationName: donation.dedicationName,
      donorMessage: donation.donorMessage,
      transactionDate: donation.transactionDate ? new Date(donation.transactionDate) : null,
      receiptRequired: donation.receiptRequired,
      receiptStatus: donation.receiptStatus,
      confirmationEmailStatus: donation.confirmationEmailStatus,
      rawProviderMetadata: meta,
    },
    include: { donor: true, campaign: true, receipt: true },
  });

  return mapDonation(row);
}

export async function listReceipts(): Promise<StoredReceipt[]> {
  const rows = await prisma.donationReceipt.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map((r) => ({
    id: r.id,
    donationId: r.donationId,
    receiptNumber: r.receiptNumber,
    type: r.receiptType,
    status: r.status,
    eligibleAmountCents: r.eligibleAmountCents,
    issuedAt: r.issuedAt?.toISOString() ?? null,
    emailedAt: r.emailedAt?.toISOString() ?? null,
    pdfPath: r.pdfStorageKey,
    checksum: r.checksum,
  }));
}

export async function getReceiptByDonationId(donationId: string): Promise<StoredReceipt | undefined> {
  const r = await prisma.donationReceipt.findUnique({ where: { donationId } });
  if (!r) return undefined;
  return {
    id: r.id,
    donationId: r.donationId,
    receiptNumber: r.receiptNumber,
    type: r.receiptType,
    status: r.status,
    eligibleAmountCents: r.eligibleAmountCents,
    issuedAt: r.issuedAt?.toISOString() ?? null,
    emailedAt: r.emailedAt?.toISOString() ?? null,
    pdfPath: r.pdfStorageKey,
    checksum: r.checksum,
  };
}

export async function upsertReceipt(receipt: StoredReceipt): Promise<StoredReceipt> {
  const row = await prisma.donationReceipt.upsert({
    where: { donationId: receipt.donationId },
    create: {
      id: receipt.id,
      donationId: receipt.donationId,
      receiptNumber: receipt.receiptNumber,
      receiptType: receipt.type,
      status: receipt.status,
      eligibleAmountCents: receipt.eligibleAmountCents,
      issuedAt: receipt.issuedAt ? new Date(receipt.issuedAt) : null,
      emailedAt: receipt.emailedAt ? new Date(receipt.emailedAt) : null,
      pdfStorageKey: receipt.pdfPath,
      checksum: receipt.checksum,
      currency: 'CAD',
    },
    update: {
      receiptNumber: receipt.receiptNumber,
      receiptType: receipt.type,
      status: receipt.status,
      eligibleAmountCents: receipt.eligibleAmountCents,
      issuedAt: receipt.issuedAt ? new Date(receipt.issuedAt) : null,
      emailedAt: receipt.emailedAt ? new Date(receipt.emailedAt) : null,
      pdfStorageKey: receipt.pdfPath,
      checksum: receipt.checksum,
    },
  });

  await prisma.donation.update({
    where: { id: receipt.donationId },
    data: { receiptStatus: row.status },
  });

  return {
    id: row.id,
    donationId: row.donationId,
    receiptNumber: row.receiptNumber,
    type: row.receiptType,
    status: row.status,
    eligibleAmountCents: row.eligibleAmountCents,
    issuedAt: row.issuedAt?.toISOString() ?? null,
    emailedAt: row.emailedAt?.toISOString() ?? null,
    pdfPath: row.pdfStorageKey,
    checksum: row.checksum,
  };
}

export async function nextReceiptSequence(year: number): Promise<number> {
  const row = await prisma.receiptSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return row.lastValue;
}

export async function addAudit(
  entry: Omit<AuditEntry, 'id' | 'createdAt'> & { id?: string }
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      newData: entry.detail ? ({ detail: entry.detail } as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function listAudits(limit = 50): Promise<AuditEntry[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    detail:
      r.newData && typeof r.newData === 'object' && r.newData !== null && 'detail' in r.newData
        ? String((r.newData as { detail?: unknown }).detail ?? '')
        : undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}

type DonationRow = {
  id: string;
  localReference: string | null;
  zeffyTransactionId: string | null;
  amountCents: number;
  eligibleReceiptAmountCents: number;
  frequency: StoredDonation['frequency'];
  status: StoredDonation['status'];
  isAnonymous: boolean;
  isEligibleGift: boolean;
  dedicationType: StoredDonation['dedicationType'] | null;
  dedicationName: string | null;
  donorMessage: string | null;
  transactionDate: Date | null;
  receiptRequired: boolean;
  receiptStatus: StoredDonation['receiptStatus'];
  confirmationEmailStatus: StoredDonation['confirmationEmailStatus'];
  rawProviderMetadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  donor: { email: string; firstName: string | null; lastName: string | null; marketingConsent: boolean } | null;
  campaign: { slug: string; name: string } | null;
  receipt: { receiptNumber: string } | null;
};

function mapDonation(row: DonationRow): StoredDonation {
  const meta = (row.rawProviderMetadata || {}) as {
    reference?: string;
    marketingConsent?: boolean;
    receiptEmailStatus?: StoredDonation['receiptEmailStatus'];
    receiptNumber?: string | null;
  };

  return {
    id: row.id,
    reference: row.localReference || meta.reference || row.zeffyTransactionId || row.id,
    zeffyTransactionId: row.zeffyTransactionId,
    email: row.donor?.email ?? null,
    firstName: row.donor?.firstName ?? null,
    lastName: row.donor?.lastName ?? null,
    amountCents: row.amountCents,
    eligibleReceiptAmountCents: row.eligibleReceiptAmountCents,
    currency: 'CAD',
    frequency: row.frequency,
    campaignSlug: row.campaign?.slug || 'general',
    campaignName: row.campaign?.name || 'General Fund',
    status: row.status,
    isAnonymous: row.isAnonymous,
    isEligibleGift: row.isEligibleGift,
    dedicationType: row.dedicationType || 'NONE',
    dedicationName: row.dedicationName,
    donorMessage: row.donorMessage,
    marketingConsent: meta.marketingConsent ?? row.donor?.marketingConsent ?? false,
    transactionDate: row.transactionDate?.toISOString() ?? null,
    receiptRequired: row.receiptRequired,
    receiptStatus: row.receiptStatus,
    receiptNumber: row.receipt?.receiptNumber ?? meta.receiptNumber ?? null,
    confirmationEmailStatus: row.confirmationEmailStatus,
    receiptEmailStatus: meta.receiptEmailStatus || 'SKIPPED',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function ensureCampaignSeed() {
  const { DEFAULT_CAMPAIGNS } = await import('./campaigns');
  for (const c of DEFAULT_CAMPAIGNS) {
    await prisma.campaign.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        embedUrl: c.embedUrl || null,
        status: 'ACTIVE',
      },
      update: {
        name: c.name,
        description: c.description,
        embedUrl: c.embedUrl || null,
      },
    });
  }
}
