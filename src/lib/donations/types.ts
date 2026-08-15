import { z } from 'zod';

export const CreateDonationIntentSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  amountCents: z.number().int().positive().max(10_000_000),
  currency: z.literal('CAD').default('CAD'),
  frequency: z.enum(['ONE_TIME', 'MONTHLY']),
  campaignSlug: z.string().min(1),
  isAnonymous: z.boolean().default(false),
  dedicationType: z.enum(['NONE', 'IN_HONOUR', 'IN_MEMORY']).default('NONE'),
  dedicationName: z.string().max(120).optional(),
  donorMessage: z.string().max(2000).optional(),
  marketingConsent: z.boolean().default(false),
  privacyConsent: z.boolean(),
});

export type CreateDonationIntentInput = z.infer<typeof CreateDonationIntentSchema>;

export type DonationRecordStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type ReceiptRecordStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'GENERATED'
  | 'EMAILED'
  | 'CANCELLED'
  | 'FAILED';
export type EmailRecordStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

export interface StoredDonation {
  id: string;
  reference: string;
  zeffyTransactionId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  amountCents: number;
  eligibleReceiptAmountCents: number;
  currency: 'CAD';
  frequency: 'ONE_TIME' | 'MONTHLY';
  campaignSlug: string;
  campaignName: string;
  status: DonationRecordStatus;
  isAnonymous: boolean;
  isEligibleGift: boolean;
  dedicationType: 'NONE' | 'IN_HONOUR' | 'IN_MEMORY';
  dedicationName: string | null;
  donorMessage: string | null;
  marketingConsent: boolean;
  transactionDate: string | null;
  receiptRequired: boolean;
  receiptStatus: ReceiptRecordStatus;
  receiptNumber: string | null;
  confirmationEmailStatus: EmailRecordStatus;
  receiptEmailStatus: EmailRecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredReceipt {
  id: string;
  donationId: string;
  receiptNumber: string;
  type: 'OFFICIAL' | 'ACKNOWLEDGEMENT' | 'REPLACEMENT';
  status: ReceiptRecordStatus;
  eligibleAmountCents: number;
  issuedAt: string | null;
  emailedAt: string | null;
  pdfPath: string | null;
  checksum: string | null;
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  detail?: string;
}
