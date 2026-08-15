import type { StoredDonation } from '@/lib/donations/types';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import { donationEnv } from '@/lib/config/env';

export function renderDonationConfirmation(
  donation: StoredDonation,
  officialReceiptEligible: boolean
): { subject: string; html: string; text: string } {
  const name = [donation.firstName, donation.lastName].filter(Boolean).join(' ') || 'Friend';
  const amount = formatCadFromCents(donation.amountCents);
  const threshold = donationEnv.charity.receiptThresholdCents / 100;

  let receiptLine: string;
  if (!donationEnv.charity.receiptingEnabled) {
    receiptLine =
      'This document confirms that LoveCry received your contribution. It is not an official charitable donation receipt.';
  } else if (officialReceiptEligible) {
    receiptLine = 'Your official charitable donation receipt will be emailed separately.';
  } else {
    receiptLine = `LoveCry issues official charitable donation receipts for eligible donations of $${threshold} or more. Your donation confirmation is not an official charitable tax receipt.`;
  }

  const subject = 'Thank you for supporting LoveCry';
  const text = [
    `Hi ${name},`,
    '',
    `Thank you for your ${donation.frequency === 'MONTHLY' ? 'monthly' : 'one-time'} gift of ${amount} to ${donation.campaignName}.`,
    `Reference: ${donation.reference}`,
    '',
    receiptLine,
    '',
    'With gratitude,',
    'LoveCry The Street Kids Organization',
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
      <h1 style="font-size:20px">Thank you, ${name}</h1>
      <p>Your <strong>${donation.frequency === 'MONTHLY' ? 'monthly' : 'one-time'}</strong> gift of <strong>${amount}</strong> to <strong>${donation.campaignName}</strong> means so much.</p>
      <p>Reference: <code>${donation.reference}</code></p>
      <p>${receiptLine}</p>
      <p>LoveCry The Street Kids Organization</p>
    </div>
  `;

  return { subject, html, text };
}
