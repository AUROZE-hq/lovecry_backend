'use client';

import { useMemo, useState } from 'react';
import { isAllowedZeffyEmbedUrl } from '@/lib/config/zeffy-allowlist';

export interface ZeffyDonationEmbedProps {
  campaignId: string;
  campaignName: string;
  embedUrl: string;
  minimumHeight?: number;
}

export default function ZeffyDonationEmbed({
  campaignId,
  campaignName,
  embedUrl,
  minimumHeight = 720,
}: ZeffyDonationEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const safeUrl = useMemo(() => {
    if (!embedUrl.trim()) return null;
    return isAllowedZeffyEmbedUrl(embedUrl) ? embedUrl : null;
  }, [embedUrl]);

  if (!embedUrl.trim()) {
    return (
      <div
        className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center"
        role="status"
        aria-label={`${campaignName} donation form placeholder`}
      >
        <p className="text-lg font-bold text-white">Donation form coming soon</p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
          The Zeffy embed for <span className="text-white/80">{campaignName}</span> will appear here
          once the campaign URL is added. Your payment will stay on LoveCry.ca.
        </p>
        <p className="mt-4 text-xs uppercase tracking-widest text-white/35">Campaign: {campaignId}</p>
      </div>
    );
  }

  if (!safeUrl) {
    return (
      <div
        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-10 text-center text-sm text-red-200"
        role="alert"
      >
        This donation form URL is not on the approved Zeffy domain list and was blocked for security.
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
      {!loaded && !errored && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a]">
          <p className="text-sm text-white/60">Loading secure donation form…</p>
        </div>
      )}
      {errored && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a] px-6 text-center">
          <p className="text-sm text-white/70">
            We couldn&apos;t load the donation form. Please refresh or try again later.
          </p>
        </div>
      )}
      <iframe
        title={`Donate to ${campaignName} via Zeffy`}
        src={safeUrl}
        className="w-full border-0"
        style={{ minHeight: minimumHeight }}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        allow="payment *"
      />
    </div>
  );
}
