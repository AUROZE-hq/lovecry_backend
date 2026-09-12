import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactEmails } from '@/lib/contact/email';
import { logInfo, logWarn } from '@/lib/security/logger';

const contactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.').max(80),
  lastName: z.string().trim().min(1, 'Last name is required.').max(80),
  email: z.string().trim().email('Enter a valid email address.').max(200),
  subject: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().min(1, 'Message is required.').max(5000),
  /** Honeypot — must stay empty. */
  company: z.string().optional().default(''),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message || 'Invalid form data.';
    return NextResponse.json({ ok: false, error: first }, { status: 400 });
  }

  // Silent success for bots that fill the honeypot.
  if (parsed.data.company.trim()) {
    return NextResponse.json({ ok: true });
  }

  const submission = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email: parsed.data.email.toLowerCase(),
    subject: parsed.data.subject,
    message: parsed.data.message,
  };

  try {
    const result = await sendContactEmails(submission);

    const bothFailed = result.autoReplyStatus === 'FAILED' && result.staffStatus === 'FAILED';
    if (bothFailed) {
      logWarn('contact_form_email_failed', {
        action: 'contact',
        errorCode: 'EMAIL_FAILED',
      });
      return NextResponse.json(
        {
          ok: false,
          error: 'We could not send your message right now. Please try again or email us directly.',
        },
        { status: 502 }
      );
    }

    logInfo('contact_form_submitted', {
      action: 'contact',
      status: 'ok',
      message: `staff=${result.staffStatus};autoReply=${result.autoReplyStatus}`,
    });

    return NextResponse.json({
      ok: true,
      message: 'Message sent. Check your email for a confirmation from LoveCry.',
    });
  } catch {
    logWarn('contact_form_exception', { action: 'contact', errorCode: 'CONTACT_EXCEPTION' });
    return NextResponse.json(
      {
        ok: false,
        error: 'Something went wrong while sending your message. Please try again.',
      },
      { status: 500 }
    );
  }
}
