export type DonationFrequency = 'ONE_TIME' | 'MONTHLY';
export type DedicationType = 'NONE' | 'IN_HONOUR' | 'IN_MEMORY';

export interface DonationCampaign {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Paste Zeffy campaign embed URL when ready */
  embedUrl: string;
}

/** Static campaigns until DB/Zeffy sync is wired */
export const DEFAULT_CAMPAIGNS: DonationCampaign[] = [
  {
    id: 'where-needed-most',
    slug: 'where-needed-most',
    name: 'Where Needed Most',
    description: 'Flexible support for LoveCry’s highest-priority community needs.',
    embedUrl: '',
  },
  {
    id: 'children-youth',
    slug: 'children-youth',
    name: 'Children and Youth Programs',
    description: 'Safe spaces, mentoring, and youth wellness programs.',
    embedUrl: '',
  },
  {
    id: 'food-essentials',
    slug: 'food-essentials',
    name: 'Food and Essential Support',
    description: 'Help families access food and essential supplies.',
    embedUrl: '',
  },
  {
    id: 'education',
    slug: 'education',
    name: 'Education Support',
    description: 'Learning opportunities and school supports for youth.',
    embedUrl: '',
  },
  {
    id: 'emergency',
    slug: 'emergency',
    name: 'Emergency Family Assistance',
    description: 'Rapid response support during family emergencies.',
    embedUrl: '',
  },
  {
    id: 'mental-health',
    slug: 'mental-health',
    name: 'Mental Health and Wellness',
    description: 'Counselling, trauma-informed care, and wellness programs.',
    embedUrl: '',
  },
  {
    id: 'community',
    slug: 'community',
    name: 'Community Development',
    description: 'Strengthen neighbourhood connection and advocacy.',
    embedUrl: '',
  },
];

export const SUGGESTED_AMOUNTS_CENTS = [2000, 2500, 5000, 10000, 25000] as const;
export const RECOMMENDED_AMOUNT_CENTS = 5000;

export function formatCadFromCents(cents: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
