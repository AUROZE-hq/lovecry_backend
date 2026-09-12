import type { StoredDonation } from '@/lib/donations/types';
import { donationEnv } from '@/lib/config/env';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import { renderDonationConfirmation } from '@/lib/email/templates';
import { logInfo, logWarn } from '@/lib/security/logger';

export type OutboundEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Overrides EMAIL_REPLY_TO when set (e.g. contact form submitter). */
  replyTo?: string;
};

export type EmailDeliveryStatus = 'SENT' | 'FAILED' | 'SKIPPED';

const globalMailbox = globalThis as unknown as { __lovecryOutbox?: OutboundEmail[] };

function outbox(): OutboundEmail[] {
  if (!globalMailbox.__lovecryOutbox) globalMailbox.__lovecryOutbox = [];
  return globalMailbox.__lovecryOutbox;
}

export function listOutbox(): OutboundEmail[] {
  return [...outbox()];
}

/**
 * Deliver email via Resend when configured.
 * Never reports SENT unless an external provider accepted the message.
 */
export async function deliverEmail(email: OutboundEmail): Promise<EmailDeliveryStatus> {
  if (!email.to) return 'SKIPPED';

  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
  const apiKey = donationEnv.email.resendApiKey;
  const from = donationEnv.email.from;

  if (provider === 'resend' && apiKey && from) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [email.to],
          reply_to: email.replyTo || donationEnv.email.replyTo || undefined,
          subject: email.subject,
          html: email.html,
          text: email.text,
        }),
      });
      if (!res.ok) {
        const providerBody = await res.text().catch(() => '');
        logWarn('email_send_failed', {
          action: 'send',
          status: res.status,
          errorCode: 'RESEND_FAILED',
          message: providerBody.slice(0, 300),
        });
        // Local/dev: keep a copy in the outbox so flows remain testable when Resend rejects.
        if (donationEnv.appEnv !== 'production' && process.env.NODE_ENV !== 'production') {
          outbox().unshift(email);
          return 'SKIPPED';
        }
        return 'FAILED';
      }
      logInfo('email_sent', { action: 'send', status: 'SENT', integration: 'resend' });
      return 'SENT';
    } catch {
      logWarn('email_send_exception', { action: 'send', errorCode: 'RESEND_EXCEPTION' });
      return 'FAILED';
    }
  }

  // Dev/outbox only — not delivered externally
  outbox().unshift(email);
  logInfo('email_not_configured', {
    action: 'send',
    status: 'SKIPPED',
    message: 'Resend not configured; message kept in local outbox and marked SKIPPED (not SENT).',
  });
  return 'SKIPPED';
}

export async function sendDonationEmails(
  donation: StoredDonation,
  officialReceiptEligible: boolean
): Promise<{
  confirmationStatus: EmailDeliveryStatus;
  receiptStatus: EmailDeliveryStatus;
}> {
  if (!donation.email) {
    return { confirmationStatus: 'SKIPPED', receiptStatus: 'SKIPPED' };
  }

  const rendered = renderDonationConfirmation(donation, officialReceiptEligible);
  const confirmationStatus = await deliverEmail({
    to: donation.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  let receiptStatus: EmailDeliveryStatus = 'SKIPPED';

  if (officialReceiptEligible && donationEnv.charity.receiptingEnabled) {
    receiptStatus = await deliverEmail({
      to: donation.email,
      subject: 'Your LoveCry donation receipt',
      html: `<p>Your official charitable donation receipt for ${formatCadFromCents(donation.eligibleReceiptAmountCents)} is attached or available in your donor portal.</p>`,
      text: `Your official charitable donation receipt for ${formatCadFromCents(donation.eligibleReceiptAmountCents)} is being prepared.`,
    });
  }

  return { confirmationStatus, receiptStatus };
}
