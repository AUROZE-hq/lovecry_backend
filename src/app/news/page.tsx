import NewsPageClient from './NewsPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Latest News | Lovecry',
  description:
    'Stay informed with the latest stories, updates, and real impact from Lovecry\u2019s work with children, families, and communities.',
};

export default function NewsPage() {
  return <NewsPageClient />;
}
