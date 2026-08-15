'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import ZeffyDonationEmbed from '@/components/donations/ZeffyDonationEmbed';
import {
  DEFAULT_CAMPAIGNS,
  RECOMMENDED_AMOUNT_CENTS,
  SUGGESTED_AMOUNTS_CENTS,
  formatCadFromCents,
  type DedicationType,
  type DonationFrequency,
} from '@/lib/donations/campaigns';
import { orgInfo } from '@/lib/org-info';

interface DonateExperienceProps {
  defaultEmbedUrl: string;
  receiptNotice: React.ReactNode;
}

export default function DonateExperience({ defaultEmbedUrl, receiptNotice }: DonateExperienceProps) {
  const [frequency, setFrequency] = useState<DonationFrequency>('ONE_TIME');
  const [amountCents, setAmountCents] = useState<number>(RECOMMENDED_AMOUNT_CENTS);
  const [customAmount, setCustomAmount] = useState('');
  const [campaignSlug, setCampaignSlug] = useState(DEFAULT_CAMPAIGNS[0].slug);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [dedicationType, setDedicationType] = useState<DedicationType>('NONE');
  const [dedicationName, setDedicationName] = useState('');
  const [message, setMessage] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const campaign = useMemo(
    () => DEFAULT_CAMPAIGNS.find((c) => c.slug === campaignSlug) ?? DEFAULT_CAMPAIGNS[0],
    [campaignSlug]
  );

  const embedUrl = campaign.embedUrl || defaultEmbedUrl;

  const usingCustom = customAmount.trim().length > 0;
  const resolvedAmountCents = usingCustom
    ? Math.round(Number.parseFloat(customAmount || '0') * 100)
    : amountCents;

  return (
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#f1328b]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure donation
        </div>

        <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
          Make a Difference Today
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
          Your gift helps {orgInfo.shortName} create safer spaces for healing, mentorship, and community
          support for youth and families across Toronto.
        </p>

        <ul className="mt-6 space-y-3 text-sm text-white/60">
          <li className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#f1328b]" />
            Stay on LoveCry.ca — payments are processed securely through Zeffy.
          </li>
          <li className="flex items-start gap-3">
            <Heart className="mt-0.5 h-4 w-4 shrink-0 text-[#f1328b]" />
            Support one-time or monthly giving for the programs that matter most.
          </li>
          <li className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#f1328b]" />
            Charity No. {orgInfo.charityNumber}
          </li>
        </ul>

        <div className="mt-8 space-y-6 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          {/* Frequency */}
          <fieldset>
            <legend className="text-sm font-semibold text-white">Gift type</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(
                [
                  ['ONE_TIME', 'One-time'],
                  ['MONTHLY', 'Monthly'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFrequency(value)}
                  className={`rounded-full px-4 py-3 text-sm font-bold transition ${
                    frequency === value
                      ? 'bg-gradient-to-r from-[#693492] to-[#f1328b] text-white'
                      : 'border border-white/15 bg-white/5 text-white/70 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Amounts */}
          <fieldset>
            <legend className="text-sm font-semibold text-white">Suggested amount</legend>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SUGGESTED_AMOUNTS_CENTS.map((cents) => {
                const selected = !usingCustom && amountCents === cents;
                const recommended = cents === RECOMMENDED_AMOUNT_CENTS;
                return (
                  <button
                    key={cents}
                    type="button"
                    onClick={() => {
                      setCustomAmount('');
                      setAmountCents(cents);
                    }}
                    className={`relative rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                      selected
                        ? 'border-[#f1328b]/50 bg-[#f1328b]/15 text-white'
                        : 'border-white/10 bg-white/5 text-white/75 hover:border-white/25'
                    }`}
                  >
                    {formatCadFromCents(cents)}
                    {recommended && (
                      <span className="absolute -top-2 right-2 rounded-full bg-[#f1328b] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                        Popular
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <label className="mt-4 block text-sm text-white/60">
              Custom amount (CAD)
              <input
                type="number"
                min="1"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="e.g. 75"
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
              />
            </label>
            {resolvedAmountCents > 0 && resolvedAmountCents < 2000 && (
              <p className="mt-2 text-xs text-amber-200/80">
                Amounts under $20 still help — you&apos;ll get a confirmation email, not an official tax
                receipt (when official receipting is enabled).
              </p>
            )}
          </fieldset>

          {/* Campaign */}
          <label className="block text-sm font-semibold text-white">
            Choose a campaign
            <select
              value={campaignSlug}
              onChange={(e) => setCampaignSlug(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm font-normal text-white outline-none focus:border-[#f1328b]/50"
            >
              {DEFAULT_CAMPAIGNS.map((c) => (
                <option key={c.slug} value={c.slug} className="bg-[#111] text-white">
                  {c.name}
                </option>
              ))}
            </select>
            <span className="mt-2 block text-xs font-normal leading-relaxed text-white/45">
              {campaign.description}
            </span>
          </label>

          {/* Preferences */}
          <div className="space-y-3 border-t border-white/10 pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-white/60">
                First name
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
                />
              </label>
              <label className="block text-sm text-white/60">
                Last name
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
                />
              </label>
            </div>
            <label className="block text-sm text-white/60">
              Email (for confirmation)
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
              />
            </label>

            <label className="flex items-start gap-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-1"
              />
              Donate anonymously
            </label>

            <fieldset>
              <legend className="text-sm font-semibold text-white">Dedication (optional)</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ['NONE', 'None'],
                    ['IN_HONOUR', 'In honour'],
                    ['IN_MEMORY', 'In memory'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDedicationType(value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                      dedicationType === value
                        ? 'bg-white text-black'
                        : 'border border-white/15 text-white/60 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {dedicationType !== 'NONE' && (
                <input
                  type="text"
                  value={dedicationName}
                  onChange={(e) => setDedicationName(e.target.value)}
                  placeholder="Name of the person"
                  className="mt-3 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#f1328b]/50"
                />
              )}
            </fieldset>

            <label className="block text-sm text-white/60">
              Personal message (optional)
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
              />
            </label>

            <label className="flex items-start gap-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-1"
              />
              Send me LoveCry updates (optional — not required to donate)
            </label>

            <label className="flex items-start gap-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="mt-1"
                required
              />
              I agree to LoveCry&apos;s privacy practices for processing this donation.
            </label>
          </div>

          <div>{receiptNotice}</div>

          <p className="text-xs text-white/40">
            Selected: {formatCadFromCents(Math.max(resolvedAmountCents, 0))} · {frequency === 'MONTHLY' ? 'Monthly' : 'One-time'} ·{' '}
            {campaign.name}
          </p>

          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          {!embedUrl && (
            <button
              type="button"
              disabled={busy || resolvedAmountCents <= 0 || !privacyConsent}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  const intentRes = await fetch('/api/donations/intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: email || undefined,
                      firstName: firstName || undefined,
                      lastName: lastName || undefined,
                      amountCents: resolvedAmountCents,
                      currency: 'CAD',
                      frequency,
                      campaignSlug,
                      isAnonymous,
                      dedicationType,
                      dedicationName: dedicationName || undefined,
                      donorMessage: message || undefined,
                      marketingConsent,
                      privacyConsent,
                    }),
                  });
                  const intent = await intentRes.json();
                  if (!intentRes.ok) throw new Error(intent.error || 'Could not start donation');

                  const payRes = await fetch(`/api/donations/${intent.reference}/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mockPay: true }),
                  });
                  const paid = await payRes.json();
                  if (!payRes.ok) throw new Error(paid.error || 'Could not complete mock payment');

                  router.push(
                    `/donate/success?ref=${encodeURIComponent(intent.reference)}&amount=${encodeURIComponent(formatCadFromCents(resolvedAmountCents))}&campaign=${encodeURIComponent(campaign.name)}`
                  );
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Something went wrong');
                } finally {
                  setBusy(false);
                }
              }}
              className="w-full rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? 'Processing…' : 'Test donation flow (until Zeffy is connected)'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#1a0a14]/80 to-[#050505] p-2 sm:p-3">
          <div className="mb-3 px-3 pt-2">
            <h2 className="text-lg font-bold text-white">Complete your donation</h2>
            <p className="mt-1 text-sm text-white/50">
              Secure form for {campaign.name}. Zeffy processes the payment inside this page.
            </p>
          </div>
          <ZeffyDonationEmbed
            campaignId={campaign.id}
            campaignName={campaign.name}
            embedUrl={embedUrl}
            minimumHeight={680}
          />
        </div>

        <p className="text-center text-xs text-white/35">
          Need help?{' '}
          <Link href="/contact" className="text-[#f1328b] underline-offset-2 hover:underline">
            Contact LoveCry
          </Link>
        </p>
      </div>
    </div>
  );
}
