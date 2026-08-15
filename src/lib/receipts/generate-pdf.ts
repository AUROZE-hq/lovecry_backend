import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import type { StoredDonation } from '@/lib/donations/types';
import { formatCadFromCents } from '@/lib/donations/campaigns';

export async function generateReceiptArtifact(input: {
  receiptNumber: string;
  donation: StoredDonation;
  charityName: string;
  registrationNumber: string;
  charityAddress: string;
}): Promise<{ path: string; checksum: string; body: string }> {
  const donorName =
    [input.donation.firstName, input.donation.lastName].filter(Boolean).join(' ') ||
    input.donation.email ||
    'Donor';

  const body = [
    'OFFICIAL RECEIPT FOR INCOME TAX PURPOSES',
    '========================================',
    `Receipt No: ${input.receiptNumber}`,
    `Charity: ${input.charityName}`,
    `Registration: ${input.registrationNumber}`,
    `Address: ${input.charityAddress}`,
    '',
    `Donor: ${donorName}`,
    `Date received: ${input.donation.transactionDate || input.donation.createdAt}`,
    `Date issued: ${new Date().toISOString()}`,
    `Total donated: ${formatCadFromCents(input.donation.amountCents)}`,
    `Eligible amount of gift: ${formatCadFromCents(input.donation.eligibleReceiptAmountCents)}`,
    'Advantage: $0.00',
    '',
    'CRA: canada.ca/charities-giving',
    '',
    'This file is a server-generated artifact. Replace with signed PDF library in production.',
  ].join('\n');

  const checksum = createHash('sha256').update(body).digest('hex');
  const dir = path.join(process.cwd(), '.data', 'receipts');
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${input.receiptNumber}.txt`);
  await writeFile(filePath, body, 'utf8');

  return { path: filePath, checksum, body };
}
