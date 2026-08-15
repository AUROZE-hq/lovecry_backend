export type MemberProfile = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  emergencyContact: string;
  notes: string;
  updatedAt: string;
};

export type EventRegistration = {
  id: string;
  email: string;
  eventId: string;
  eventTitle: string;
  registeredAt: string;
  status: 'REGISTERED' | 'CANCELLED';
};

export type CounsellingBooking = {
  id: string;
  email: string;
  slotId: string;
  counsellor: string;
  date: string;
  time: string;
  mode: string;
  message: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
};

export type DonorPreferences = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  marketingConsent: boolean;
  updatedAt: string;
};

type MemberStore = {
  profiles: Map<string, MemberProfile>;
  registrations: EventRegistration[];
  bookings: CounsellingBooking[];
  donorPrefs: Map<string, DonorPreferences>;
};

const g = globalThis as unknown as { __lovecryMemberStore?: MemberStore };

function store(): MemberStore {
  if (!g.__lovecryMemberStore) {
    g.__lovecryMemberStore = {
      profiles: new Map(),
      registrations: [],
      bookings: [],
      donorPrefs: new Map(),
    };
  }
  return g.__lovecryMemberStore;
}

export function getMemberProfile(email: string): MemberProfile | null {
  return store().profiles.get(email.toLowerCase()) ?? null;
}

export function upsertMemberProfile(
  email: string,
  data: Partial<Omit<MemberProfile, 'email' | 'updatedAt'>>
): MemberProfile {
  const key = email.toLowerCase();
  const existing = store().profiles.get(key);
  const next: MemberProfile = {
    email: key,
    firstName: data.firstName ?? existing?.firstName ?? '',
    lastName: data.lastName ?? existing?.lastName ?? '',
    phone: data.phone ?? existing?.phone ?? '',
    emergencyContact: data.emergencyContact ?? existing?.emergencyContact ?? '',
    notes: data.notes ?? existing?.notes ?? '',
    updatedAt: new Date().toISOString(),
  };
  store().profiles.set(key, next);
  return next;
}

export function listRegistrations(email: string): EventRegistration[] {
  return store()
    .registrations.filter((r) => r.email === email.toLowerCase() && r.status === 'REGISTERED')
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
}

export function registerForEvent(input: {
  email: string;
  eventId: string;
  eventTitle: string;
}): EventRegistration {
  const email = input.email.toLowerCase();
  const existing = store().registrations.find(
    (r) => r.email === email && r.eventId === input.eventId && r.status === 'REGISTERED'
  );
  if (existing) return existing;

  const row: EventRegistration = {
    id: crypto.randomUUID(),
    email,
    eventId: input.eventId,
    eventTitle: input.eventTitle,
    registeredAt: new Date().toISOString(),
    status: 'REGISTERED',
  };
  store().registrations.unshift(row);
  return row;
}

export function cancelRegistration(email: string, registrationId: string): boolean {
  const row = store().registrations.find(
    (r) => r.id === registrationId && r.email === email.toLowerCase()
  );
  if (!row) return false;
  row.status = 'CANCELLED';
  return true;
}

export function listBookings(email: string): CounsellingBooking[] {
  return store()
    .bookings.filter((b) => b.email === email.toLowerCase() && b.status !== 'CANCELLED')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function requestCounselling(input: {
  email: string;
  slotId: string;
  counsellor: string;
  date: string;
  time: string;
  mode: string;
  message?: string;
}): CounsellingBooking {
  const email = input.email.toLowerCase();
  const existing = store().bookings.find(
    (b) => b.email === email && b.slotId === input.slotId && b.status !== 'CANCELLED'
  );
  if (existing) return existing;

  const row: CounsellingBooking = {
    id: crypto.randomUUID(),
    email,
    slotId: input.slotId,
    counsellor: input.counsellor,
    date: input.date,
    time: input.time,
    mode: input.mode,
    message: input.message ?? '',
    status: 'REQUESTED',
    createdAt: new Date().toISOString(),
  };
  store().bookings.unshift(row);
  return row;
}

export function cancelBooking(email: string, bookingId: string): boolean {
  const row = store().bookings.find((b) => b.id === bookingId && b.email === email.toLowerCase());
  if (!row) return false;
  row.status = 'CANCELLED';
  return true;
}

export function getDonorPreferences(email: string): DonorPreferences | null {
  return store().donorPrefs.get(email.toLowerCase()) ?? null;
}

export function upsertDonorPreferences(
  email: string,
  data: Partial<Omit<DonorPreferences, 'email' | 'updatedAt'>>
): DonorPreferences {
  const key = email.toLowerCase();
  const existing = store().donorPrefs.get(key);
  const next: DonorPreferences = {
    email: key,
    firstName: data.firstName ?? existing?.firstName ?? '',
    lastName: data.lastName ?? existing?.lastName ?? '',
    phone: data.phone ?? existing?.phone ?? '',
    marketingConsent: data.marketingConsent ?? existing?.marketingConsent ?? false,
    updatedAt: new Date().toISOString(),
  };
  store().donorPrefs.set(key, next);
  return next;
}
