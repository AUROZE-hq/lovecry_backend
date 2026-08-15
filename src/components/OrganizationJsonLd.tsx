import { orgInfo } from '@/lib/org-info';

export default function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name: orgInfo.legalName,
    url: orgInfo.websiteHref,
    taxID: orgInfo.charityNumber,
    telephone: orgInfo.phoneHref.replace('tel:', ''),
    email: orgInfo.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '150 Cosburn Ave.',
      addressLocality: 'East York',
      addressRegion: 'ON',
      postalCode: 'M4J 2L9',
      addressCountry: 'CA',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
