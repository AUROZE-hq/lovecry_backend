import type { Metadata } from 'next';
import TransparencyContent from '@/components/about/TransparencyContent';

export const metadata: Metadata = {
  title: 'Transparency & Governance | LoveCry',
  description:
    'Learn about LoveCry The Street Kids Organization’s commitment to transparency, accountability, and ethical governance. View our 2021 Financial Summary.',
};

export default function TransparencyGovernancePage() {
  return <TransparencyContent />;
}
