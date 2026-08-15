'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Globe, Building2, Music2 } from 'lucide-react';

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
  </svg>
);
import { orgInfo } from '@/lib/org-info';

const ease = [0.22, 1, 0.36, 1] as const;

const exploreLinks = orgInfo.navLinks;

const supportLinks = [
  { label: 'Donate', href: '/donate' },
  { label: 'Volunteer', href: '/contact#support-options' },
  { label: 'Contact', href: '/contact' },
  { label: 'Transparency & Governance', href: '/about/transparency-governance' },
];

const centerSocialLinks = [
  { label: 'Phone', href: orgInfo.phoneHref, icon: Phone },
  { label: 'Email', href: orgInfo.emailHref, icon: Mail },
  { label: 'Location', href: `https://maps.google.com/?q=${encodeURIComponent(orgInfo.address)}`, icon: MapPin },
  { label: 'Facebook', href: 'https://www.facebook.com/lovecry', icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/lovecry', icon: InstagramIcon },
  { label: 'Spotify', href: 'https://open.spotify.com/show/lovecry', icon: Music2 },
  { label: 'YouTube', href: 'https://www.youtube.com/@lovecry', icon: YoutubeIcon },
];

const contactLinks = [
  { label: 'Phone', value: orgInfo.phone, href: orgInfo.phoneHref, icon: Phone },
  { label: 'Email', value: orgInfo.email.toLowerCase(), href: orgInfo.emailHref, icon: Mail },
  { label: 'Website', value: orgInfo.website.toLowerCase(), href: orgInfo.websiteHref, icon: Globe },
  {
    label: 'Address',
    value: orgInfo.address,
    href: `https://maps.google.com/?q=${encodeURIComponent(orgInfo.address)}`,
    icon: MapPin,
  },
  { label: 'Charity Number', value: orgInfo.charityNumber, href: '/contact', icon: Building2 },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#050505] text-white pt-16 sm:pt-20 lg:pt-24 pb-10 lg:pb-12 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-12 grid grid-cols-1 gap-12 lg:mb-16 lg:grid-cols-3 lg:items-start lg:gap-8">
          {/* Explore */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="min-w-0 lg:justify-self-start"
          >
            <h3 className="text-[11px] sm:text-[13px] font-bold text-gray-200 mb-4 sm:mb-6 uppercase tracking-wider">
              Explore
            </h3>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[12px] sm:text-[14px] text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Center branding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
            className="flex flex-col items-center px-4 text-center lg:justify-self-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#f1328b]/30 bg-[#f1328b]/10 shadow-[0_0_24px_rgba(241,50,139,0.15)]">
              <Image
                src="/LoveCryLogo.png"
                alt="LoveCry logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </div>

            <h2
              className="text-2xl font-bold leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#f1328b] to-[#c492ef] sm:text-3xl brand-script"
              style={{ fontFamily: '"Script MT", "Script MT Bold", "Brush Script MT", cursive' }}
            >
              {orgInfo.shortName}
            </h2>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/45 sm:text-[11px]">
              The Street Kids Organization
            </p>
            <p className="mt-3 max-w-xs text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50 sm:max-w-sm">
              {orgInfo.officialWebsiteLine}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-white/45">
              Registered Canadian Charity
            </p>
            <p className="mt-1 text-[11px] text-white/45">
              CRA Charity Number: {orgInfo.charityNumber}
            </p>

            <p className="mt-5 max-w-xs text-sm italic leading-relaxed text-white/50 sm:max-w-sm">
              &ldquo;{orgInfo.tagline}&rdquo;
            </p>

            <div className="mt-6 flex items-center gap-3">
              {centerSocialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 transition-all hover:border-[#f1328b]/40 hover:bg-[#f1328b]/10 hover:text-[#f1328b]"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="min-w-0 lg:justify-self-end lg:text-right"
          >
            <h3 className="text-[11px] sm:text-[13px] font-bold text-gray-200 mb-4 sm:mb-6 uppercase tracking-wider">
              Support
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[12px] sm:text-[14px] text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-10">
          {contactLinks.map((item) => {
            const Icon = item.icon;

            return (
              <motion.a
                key={item.label}
                href={item.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease }}
                className="group min-w-0 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 hover:bg-white/8 transition-colors"
              >
                <div className="shrink-0 mt-0.5 rounded-xl bg-[#f1328b]/10 p-2 text-[#f1328b]">
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] sm:tracking-[0.3em] text-white/40 mb-1">
                    {item.label}
                  </div>

                  <div className="text-[14px] leading-snug text-white/85 group-hover:text-white break-words">
                    {item.value}
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>

        <div className="w-full h-[1px] bg-white/10 mb-8" />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between text-[12px] sm:text-[13px] text-white/45">
          <p className="leading-relaxed">
            © 2026 {orgInfo.name}. All rights reserved.
          </p>

          <p className="max-w-2xl leading-relaxed">
            {orgInfo.tagline} Supporting youth, families, and individuals across Toronto with dignity,
            care, and healing-centered community support.
          </p>
        </div>
      </div>

      {/* Background Brand Text */}
      <div className="absolute bottom-[-1%] sm:bottom-[-4%] left-[50%] -translate-x-1/2 select-none pointer-events-none w-full flex justify-center overflow-hidden">
        <h1 className="text-[34vw] sm:text-[28vw] lg:text-[24vw] font-black text-[#0f0f0f] leading-none tracking-tighter opacity-55 sm:opacity-70 lg:opacity-80 brand-script">
          LoveCry
        </h1>
      </div>
    </footer>
  );
}