import { deliverEmail, type EmailDeliveryStatus } from '@/lib/email/send';
import { orgInfo } from '@/lib/org-info';

export type ContactSubmission = {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function staffInbox(): string {
  return (process.env.CONTACT_INBOX_EMAIL || orgInfo.email).trim().toLowerCase();
}

export function renderContactAutoReply(input: ContactSubmission): {
  subject: string;
  html: string;
  text: string;
} {
  const name = `${input.firstName} ${input.lastName}`.trim() || 'there';
  const subjectLine = input.subject || 'your message';

  const subject = `We received your message — ${orgInfo.shortName}`;
  const text = [
    `Hi ${name},`,
    '',
    `Thank you for contacting ${orgInfo.shortName}.`,
    'We have received your message and will get back to you soon.',
    '',
    `Subject: ${subjectLine}`,
    '',
    'If your matter is urgent, you can also reach us at:',
    `${orgInfo.email.toLowerCase()} | ${orgInfo.phone}`,
    '',
    'With care,',
    `${orgInfo.shortName} Team`,
    orgInfo.websiteHref,
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.55;color:#111;max-width:560px">
      <h1 style="font-size:20px;margin:0 0 12px">We received your message</h1>
      <p style="margin:0 0 12px">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 12px">
        Thank you for contacting <strong>${escapeHtml(orgInfo.shortName)}</strong>.
        Your message has been received and our team will reply soon.
      </p>
      <p style="margin:0 0 12px"><strong>Subject:</strong> ${escapeHtml(subjectLine)}</p>
      <p style="margin:0 0 12px;color:#444">
        If your matter is urgent, reach us at
        <a href="${escapeHtml(orgInfo.emailHref)}">${escapeHtml(orgInfo.email.toLowerCase())}</a>
        or ${escapeHtml(orgInfo.phone)}.
      </p>
      <p style="margin:24px 0 0">With care,<br/>${escapeHtml(orgInfo.shortName)} Team</p>
    </div>
  `;

  return { subject, html, text };
}

export function renderContactStaffNotification(input: ContactSubmission): {
  subject: string;
  html: string;
  text: string;
} {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const subjectLine = input.subject || '(No subject)';
  const subject = `Contact form: ${subjectLine} — ${fullName}`;

  const text = [
    'New contact form submission from the LoveCry website.',
    '',
    `Name: ${fullName}`,
    `Email: ${input.email}`,
    `Subject: ${subjectLine}`,
    '',
    'Message:',
    input.message,
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.55;color:#111;max-width:640px">
      <h1 style="font-size:18px;margin:0 0 12px">New website contact message</h1>
      <p style="margin:0 0 8px"><strong>Name:</strong> ${escapeHtml(fullName)}</p>
      <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(input.email)}</p>
      <p style="margin:0 0 8px"><strong>Subject:</strong> ${escapeHtml(subjectLine)}</p>
      <p style="margin:16px 0 8px"><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:inherit;background:#f6f6f6;padding:12px;border-radius:8px;margin:0">${escapeHtml(input.message)}</pre>
    </div>
  `;

  return { subject, html, text };
}

export async function sendContactEmails(input: ContactSubmission): Promise<{
  autoReplyStatus: EmailDeliveryStatus;
  staffStatus: EmailDeliveryStatus;
}> {
  const autoReply = renderContactAutoReply(input);
  const staff = renderContactStaffNotification(input);
  const inbox = staffInbox();

  const [staffStatus, autoReplyStatus] = await Promise.all([
    deliverEmail({
      to: inbox,
      subject: staff.subject,
      html: staff.html,
      text: staff.text,
      replyTo: input.email,
    }),
    deliverEmail({
      to: input.email,
      subject: autoReply.subject,
      html: autoReply.html,
      text: autoReply.text,
    }),
  ]);

  return { autoReplyStatus, staffStatus };
}
