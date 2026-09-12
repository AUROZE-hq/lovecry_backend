import nodemailer from 'nodemailer';
import type { StoredDonation } from '@/lib/donations/types';
import { donationEnv, isResendConfigured, isSmtpConfigured } from '@/lib/config/env';
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

function keepDevOutbox(email: OutboundEmail): EmailDeliveryStatus {
  outbox().unshift(email);
  return 'SKIPPED';
}

async function deliverViaSmtp(email: OutboundEmail): Promise<EmailDeliveryStatus> {
  if (!isSmtpConfigured()) {
    logWarn('email_smtp_not_configured', {
      action: 'send',
      errorCode: 'SMTP_NOT_CONFIGURED',
      message: 'Set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM (or MAIL_FROM).',
    });
    if (donationEnv.appEnv !== 'production' && process.env.NODE_ENV !== 'production') {
      return keepDevOutbox(email);
    }
    return 'FAILED';
  }

  if (donationEnv.email.dryRun) {
    logInfo('email_dry_run', { action: 'send', status: 'SKIPPED', integration: 'smtp' });
    return keepDevOutbox(email);
  }

  try {
    const transporter = nodemailer.createTransport({
      host: donationEnv.email.smtp.host,
      port: donationEnv.email.smtp.port,
      secure: donationEnv.email.smtp.secure,
      auth: {
        user: donationEnv.email.smtp.user,
        pass: donationEnv.email.smtp.pass,
      },
    });

    await transporter.sendMail({
      from: donationEnv.email.from,
      to: email.to,
      replyTo: email.replyTo || donationEnv.email.replyTo || undefined,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    logInfo('email_sent', { action: 'send', status: 'SENT', integration: 'smtp' });
    return 'SENT';
  } catch (err) {
    logWarn('email_smtp_failed', {
      action: 'send',
      errorCode: 'SMTP_FAILED',
      message: err instanceof Error ? err.message.slice(0, 300) : 'smtp_error',
    });
    if (donationEnv.appEnv !== 'production' && process.env.NODE_ENV !== 'production') {
      return keepDevOutbox(email);
    }
    return 'FAILED';
  }
}

async function deliverViaResend(email: OutboundEmail): Promise<EmailDeliveryStatus> {
  if (!isResendConfigured()) {
    logWarn('email_resend_not_configured', {
      action: 'send',
      errorCode: 'RESEND_NOT_CONFIGURED',
    });
    if (donationEnv.appEnv !== 'production' && process.env.NODE_ENV !== 'production') {
      return keepDevOutbox(email);
    }
    return 'FAILED';
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${donationEnv.email.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: donationEnv.email.from,
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
      if (donationEnv.appEnv !== 'production' && process.env.NODE_ENV !== 'production') {
        return keepDevOutbox(email);
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

/**
 * Deliver email via Gmail SMTP (default) or Resend.
 * Never reports SENT unless an external provider accepted the message
 * (except MAIL_DRY_RUN / local outbox fallbacks which return SKIPPED).
 */
export async function deliverEmail(email: OutboundEmail): Promise<EmailDeliveryStatus> {
  if (!email.to) return 'SKIPPED';

  const provider = donationEnv.email.provider || 'smtp';

  if (provider === 'smtp' || provider === 'gmail') {
    return deliverViaSmtp(email);
  }

  if (provider === 'resend') {
    return deliverViaResend(email);
  }

  // Unknown provider — try SMTP then Resend
  if (isSmtpConfigured()) return deliverViaSmtp(email);
  if (isResendConfigured()) return deliverViaResend(email);

  outbox().unshift(email);
  logInfo('email_not_configured', {
    action: 'send',
    status: 'SKIPPED',
    message: 'No email provider configured; message kept in local outbox.',
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
