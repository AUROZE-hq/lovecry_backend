'use server';

import { redirect } from 'next/navigation';
import { EventServiceError, registerForEvent } from '@/lib/events/service';

function isNextRedirect(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    String((err as { digest?: string }).digest).startsWith('NEXT_REDIRECT')
  );
}

export async function registerPublicEventAction(formData: FormData) {
  const slug = String(formData.get('slug') || '');
  try {
    const result = await registerForEvent({
      eventId: String(formData.get('eventId') || ''),
      fullName: String(formData.get('fullName') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
    });
    const emailNote = result.emailStatus === 'SENT' ? '&emailed=1' : '';
    redirect(`/events/${slug}?registered=1${emailNote}#register`);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const message = err instanceof EventServiceError ? err.message : 'Registration could not be completed.';
    redirect(`/events/${slug}?error=${encodeURIComponent(message)}#register`);
  }
}
