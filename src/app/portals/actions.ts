'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DONOR_COOKIE } from '@/lib/auth/donor-gate';
import { MEMBER_COOKIE } from '@/lib/auth/member-gate';
import {
  cancelBooking,
  requestCounselling,
  upsertDonorPreferences,
  upsertMemberProfile,
  getMemberProfile,
} from '@/lib/members/store';
import { COUNSELLING_SLOTS } from '@/lib/members/data';
import {
  cancelOwnRegistration,
  EventServiceError,
  registerForEvent as registerPublicEvent,
} from '@/lib/events/service';

export async function logoutDonor() {
  const jar = await cookies();
  jar.delete(DONOR_COOKIE);
  redirect('/donor');
}

export async function logoutMember() {
  const jar = await cookies();
  jar.delete(MEMBER_COOKIE);
  redirect('/member');
}

export async function saveDonorPreferencesAction(formData: FormData) {
  const jar = await cookies();
  const email = jar.get(DONOR_COOKIE)?.value;
  if (!email) redirect('/donor');

  upsertDonorPreferences(email, {
    firstName: String(formData.get('firstName') || ''),
    lastName: String(formData.get('lastName') || ''),
    phone: String(formData.get('phone') || ''),
    marketingConsent: formData.get('marketingConsent') === 'on',
  });
  redirect('/donor/profile?saved=1');
}

export async function saveMemberProfileAction(formData: FormData) {
  const jar = await cookies();
  const email = jar.get(MEMBER_COOKIE)?.value;
  if (!email) redirect('/member');

  upsertMemberProfile(email, {
    firstName: String(formData.get('firstName') || ''),
    lastName: String(formData.get('lastName') || ''),
    phone: String(formData.get('phone') || ''),
    emergencyContact: String(formData.get('emergencyContact') || ''),
    notes: String(formData.get('notes') || ''),
  });
  redirect('/member/profile?saved=1');
}

export async function registerEventAction(formData: FormData) {
  const jar = await cookies();
  const email = jar.get(MEMBER_COOKIE)?.value;
  if (!email) redirect('/member');

  const eventId = String(formData.get('eventId') || '');
  const profile = getMemberProfile(email);
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || email.split('@')[0] || 'Member';

  try {
    await registerPublicEvent({
      eventId,
      fullName,
      email,
      phone: profile?.phone || '',
    });
  } catch (err) {
    if (err instanceof EventServiceError) {
      redirect(`/member/events?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }
  redirect('/member/events?registered=1');
}

export async function cancelEventAction(formData: FormData) {
  const jar = await cookies();
  const email = jar.get(MEMBER_COOKIE)?.value;
  if (!email) redirect('/member');
  try {
    await cancelOwnRegistration(email, String(formData.get('registrationId') || ''));
  } catch (err) {
    if (err instanceof EventServiceError) redirect('/member/events');
    throw err;
  }
  redirect('/member/events');
}

export async function requestCounsellingAction(formData: FormData) {
  const jar = await cookies();
  const email = jar.get(MEMBER_COOKIE)?.value;
  if (!email) redirect('/member');

  const slotId = String(formData.get('slotId') || '');
  const slot = COUNSELLING_SLOTS.find((s) => s.id === slotId);
  if (!slot) redirect('/member/counselling');

  requestCounselling({
    email,
    slotId: slot.id,
    counsellor: slot.counsellor,
    date: slot.date,
    time: slot.time,
    mode: slot.mode,
    message: String(formData.get('message') || ''),
  });
  redirect('/member/counselling?requested=1');
}

export async function cancelCounsellingAction(formData: FormData) {
  const jar = await cookies();
  const email = jar.get(MEMBER_COOKIE)?.value;
  if (!email) redirect('/member');
  cancelBooking(email, String(formData.get('bookingId') || ''));
  redirect('/member/counselling');
}
