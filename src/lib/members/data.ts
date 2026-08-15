export type MemberEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
};

export const MEMBER_EVENTS: MemberEvent[] = [
  {
    id: 'evt-wellness',
    title: 'LoveCry Wellness Series',
    date: '2026-10-12',
    time: '6:00 PM',
    location: 'Greater Toronto Area',
    category: 'Workshop',
    description: 'Yoga, meditation, and peer support for healing and resilience.',
  },
  {
    id: 'evt-healthy-hour',
    title: 'Healthy Hour Friday',
    date: '2026-10-17',
    time: '5:30 PM',
    location: 'Toronto, Ontario',
    category: 'Community',
    description: 'Casual weekly check-in with fitness and nutrition tips.',
  },
  {
    id: 'evt-healing-circle',
    title: 'Community Healing Circle',
    date: '2026-10-24',
    time: '2:00 PM',
    location: 'Regent Park Community',
    category: 'Support',
    description: 'A facilitated space for sharing and peer connection.',
  },
  {
    id: 'evt-mentorship',
    title: 'Youth Mentorship Gathering',
    date: '2026-11-01',
    time: '4:00 PM',
    location: 'Toronto, Ontario',
    category: 'Youth',
    description: 'Meet mentors and explore skill-building pathways.',
  },
  {
    id: 'evt-family',
    title: 'Family Support Session',
    date: '2026-11-08',
    time: '1:00 PM',
    location: 'Greater Toronto Area',
    category: 'Family',
    description: 'Guidance and resources for caregivers and families.',
  },
];

export type CounsellingSlot = {
  id: string;
  counsellor: string;
  date: string;
  time: string;
  mode: 'In person' | 'Virtual';
  status: 'AVAILABLE' | 'BOOKED';
};

export const COUNSELLING_SLOTS: CounsellingSlot[] = [
  {
    id: 'c-1',
    counsellor: 'Jesse Wilson, RSW',
    date: '2026-10-15',
    time: '10:00 AM',
    mode: 'In person',
    status: 'AVAILABLE',
  },
  {
    id: 'c-2',
    counsellor: 'Jesse Wilson, RSW',
    date: '2026-10-15',
    time: '2:00 PM',
    mode: 'Virtual',
    status: 'AVAILABLE',
  },
  {
    id: 'c-3',
    counsellor: 'Trauma-informed Care Team',
    date: '2026-10-22',
    time: '11:30 AM',
    mode: 'In person',
    status: 'AVAILABLE',
  },
  {
    id: 'c-4',
    counsellor: 'Trauma-informed Care Team',
    date: '2026-10-29',
    time: '3:00 PM',
    mode: 'Virtual',
    status: 'AVAILABLE',
  },
];

export const MEMBER_ANNOUNCEMENTS = [
  {
    id: 'a1',
    title: 'New wellness drop-ins this month',
    body: 'Fridays at 5:30 PM — open to registered members and youth participants.',
  },
  {
    id: 'a2',
    title: 'Counselling booking tip',
    body: 'Request a session at least 48 hours ahead so we can confirm with your counsellor.',
  },
];
