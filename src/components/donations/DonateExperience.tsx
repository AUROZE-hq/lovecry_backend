'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, X } from 'lucide-react';
import ZeffyDonationEmbed from '@/components/donations/ZeffyDonationEmbed';
import {
  DEFAULT_CAMPAIGNS,
  RECOMMENDED_AMOUNT_CENTS,
  SUGGESTED_AMOUNTS_CENTS,
  formatCadFromCents,
  type DedicationType,
  type DonationFrequency,
} from '@/lib/donations/campaigns';

type PaymentUiState =
  | 'idle'
  | 'loading'
  | 'verifying'
  | 'processing'
  | 'failed'
  | 'connection_error';

type FieldErrors = Partial<
  Record<'firstName' | 'lastName' | 'email' | 'amount' | 'dedicationName' | 'privacyConsent', string>
>;

interface DonateExperienceProps {
  defaultEmbedUrl: string;
  receiptThresholdCents: number;
  receiptingEnabled: boolean;
  authenticatedDonor?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

function makeIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function DonateExperience({
  defaultEmbedUrl,
  receiptThresholdCents,
  receiptingEnabled,
  authenticatedDonor = null,
}: DonateExperienceProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [frequency, setFrequency] = useState<DonationFrequency>('ONE_TIME');
  const [amountCents, setAmountCents] = useState(RECOMMENDED_AMOUNT_CENTS);
  const [customAmount, setCustomAmount] = useState('');
  const [campaignSlug, setCampaignSlug] = useState(DEFAULT_CAMPAIGNS[0].slug);
  const [campaignOpen, setCampaignOpen] = useState(false);

  const [firstName, setFirstName] = useState(authenticatedDonor?.firstName || '');
  const [lastName, setLastName] = useState(authenticatedDonor?.lastName || '');
  const [email, setEmail] = useState(authenticatedDonor?.email || '');
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [dedicationType, setDedicationType] = useState<DedicationType>('NONE');
  const [dedicationName, setDedicationName] = useState('');
  const [message, setMessage] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [paymentState, setPaymentState] = useState<PaymentUiState>('idle');
  const [error, setError] = useState('');
  const [, setReference] = useState<string | null>(null);
  const idempotencyKeyRef = useRef(makeIdempotencyKey());
  const submitLockRef = useRef(false);

  const campaign = useMemo(
    () => DEFAULT_CAMPAIGNS.find((c) => c.slug === campaignSlug) ?? DEFAULT_CAMPAIGNS[0],
    [campaignSlug]
  );
  const embedUrl = campaign.embedUrl || defaultEmbedUrl;
  const usingCustom = customAmount.trim().length > 0;
  const resolvedAmountCents = usingCustom
    ? Math.round(Number.parseFloat(customAmount || '0') * 100)
    : amountCents;

  const receiptEligiblePreview =
    receiptingEnabled && resolvedAmountCents >= receiptThresholdCents && Number.isFinite(resolvedAmountCents);

  const isReturning = Boolean(authenticatedDonor?.email);

  useEffect(() => {
    if (!campaignOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCampaignOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [campaignOpen]);

  function validateStep1(): boolean {
    const next: FieldErrors = {};
    if (!Number.isFinite(resolvedAmountCents) || resolvedAmountCents < 100) {
      next.amount = 'Enter a gift of at least $1.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep2(): boolean {
    const next: FieldErrors = {};
    if (!firstName.trim()) next.firstName = 'First name is required.';
    if (!lastName.trim()) next.lastName = 'Last name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (dedicationType !== 'NONE' && !dedicationName.trim()) {
      next.dedicationName = 'Enter the name for this dedication.';
    }
    if (!privacyConsent) next.privacyConsent = 'Please accept the donation and privacy terms.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function runPaymentFlow(simulateFailure = false) {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setError('');
    setPaymentState('loading');

    try {
      await delay(450);
      setPaymentState('verifying');

      const intentRes = await fetch('/api/donations/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          amountCents: resolvedAmountCents,
          currency: 'CAD',
          frequency,
          campaignSlug,
          isAnonymous,
          dedicationType,
          dedicationName: dedicationName.trim() || undefined,
          donorMessage: message.trim() || undefined,
          marketingConsent,
          privacyConsent: true,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });

      const intentBody = await intentRes.json().catch(() => null);
      if (!intentRes.ok) {
        setPaymentState('connection_error');
        setError(intentBody?.error || 'Connection error. You can safely retry.');
        return;
      }

      const ref = intentBody.reference as string;
      setReference(ref);
      setPaymentState('processing');
      await delay(500);

      if (simulateFailure) {
        await fetch(`/api/donations/${encodeURIComponent(ref)}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mockFail: true }),
        }).catch(() => null);
        setPaymentState('failed');
        setError('Payment was declined. Your card was not charged.');
        // New key only after confirmed failure so retries of the same attempt stay idempotent until user changes gift
        idempotencyKeyRef.current = makeIdempotencyKey();
        return;
      }

      if (embedUrl) {
        // Zeffy embed path: wait for provider confirmation via status polling (dev may still use mock).
        const paid = await pollUntilPaid(ref, 8);
        if (!paid) {
          setPaymentState('connection_error');
          setError('We could not verify payment yet. You can safely retry — duplicates are blocked.');
          return;
        }
      } else {
        const payRes = await fetch(`/api/donations/${encodeURIComponent(ref)}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mockPay: true }),
        });
        if (!payRes.ok) {
          const payBody = await payRes.json().catch(() => null);
          setPaymentState(payRes.status >= 500 ? 'connection_error' : 'failed');
          setError(payBody?.error || 'Payment could not be completed.');
          return;
        }
      }

      router.push(`/donate/success?ref=${encodeURIComponent(ref)}`);
    } catch {
      setPaymentState('connection_error');
      setError('Connection error. Your donation was not completed. You can safely retry.');
    } finally {
      submitLockRef.current = false;
    }
  }

  const amountLabel = Number.isFinite(resolvedAmountCents)
    ? formatCadFromCents(resolvedAmountCents)
    : '$0';
  const freqLabel = frequency === 'MONTHLY' ? 'monthly' : 'one-time';

  return (
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
      <aside className="lg:pt-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f1328b]">Donate</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
          Make a difference today.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          Your gift helps LoveCry create safer spaces for healing, mentorship and community support for
          youth and families.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white">Your gift supports</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ['HEALING', 'Mental-health centred support'],
              ['CONNECTION', 'Mentorship and community care'],
              ['FAMILIES', 'Practical support where it matters most'],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f1328b]" />
                <span>
                  <span className="font-bold text-white">{title}</span>
                  <span className="text-white/55"> — {desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-xs text-white/40">
          Secure payment powered by Zeffy. Your payment stays inside LoveCry.
        </p>
      </aside>

      <section className="rounded-[1.75rem] border border-[#3a2a55]/80 bg-[#0c0a12]/95 p-5 shadow-[0_0_40px_rgba(241,50,139,0.08)] sm:p-8">
        {step === 1 ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f1328b]">Step 1 of 2</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Choose your gift</h2>
            <p className="mt-2 text-sm text-white/55">
              Start with the amount. We&apos;ll only ask for the details needed to complete your donation.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
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
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    frequency === value
                      ? 'border-[#f1328b]/70 bg-[#f1328b]/10 text-white'
                      : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SUGGESTED_AMOUNTS_CENTS.map((cents) => {
                const selected = !usingCustom && amountCents === cents;
                return (
                  <button
                    key={cents}
                    type="button"
                    onClick={() => {
                      setCustomAmount('');
                      setAmountCents(cents);
                    }}
                    className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                      selected
                        ? 'border-[#f1328b] bg-[#f1328b]/15 text-white shadow-[0_0_18px_rgba(241,50,139,0.25)]'
                        : 'border-white/10 bg-white/[0.03] text-white/75 hover:border-white/25'
                    }`}
                  >
                    {formatCadFromCents(cents)}
                  </button>
                );
              })}
            </div>

            <label className="mt-4 block text-sm text-white/55">
              Custom amount
              <input
                inputMode="decimal"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Other amount"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-[#f1328b]/60"
              />
            </label>
            {fieldErrors.amount && <p className="mt-2 text-sm text-red-300">{fieldErrors.amount}</p>}

            <div className="mt-5">
              <p className="text-sm text-white/55">Where your gift goes</p>
              <button
                type="button"
                onClick={() => setCampaignOpen(true)}
                className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left"
              >
                <span>
                  <span className="block font-semibold text-white">{campaign.name}</span>
                  <span className="mt-0.5 block text-sm text-white/50">{campaign.description}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-[#f1328b]">Change</span>
              </button>
            </div>

            <ReceiptBanner eligible={receiptEligiblePreview} thresholdCents={receiptThresholdCents} />

            <button
              type="button"
              onClick={() => {
                if (!validateStep1()) return;
                setStep(2);
              }}
              className="mt-6 w-full rounded-full bg-[#f1328b] px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              Continue with {amountLabel} →
            </button>
            <p className="mt-3 text-center text-xs text-white/40">
              Secure donation • Powered by Zeffy • You stay on LoveCry
            </p>
            {!isReturning && (
              <p className="mt-4 text-center text-sm">
                <Link href="/donor" className="font-semibold text-[#f1328b] hover:underline">
                  Already a LoveCry donor? Sign in
                </Link>
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f1328b]">Step 2 of 2</p>
              <button
                type="button"
                onClick={() => {
                  setPaymentState('idle');
                  setError('');
                  setStep(1);
                }}
                className="text-sm font-semibold text-[#f1328b] hover:underline"
              >
                ← Change gift
              </button>
            </div>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Complete your donation</h2>
            <p className="mt-2 text-sm text-white/55">
              {isReturning
                ? `Welcome back${firstName ? `, ${firstName}` : ''}. Your ${amountLabel} ${freqLabel} gift to ${campaign.name}.`
                : `Your ${amountLabel} ${freqLabel} gift to ${campaign.name}.`}
            </p>

            {paymentState !== 'idle' && paymentState !== 'failed' && paymentState !== 'connection_error' && (
              <PaymentStatusCard state={paymentState} />
            )}

            {(paymentState === 'failed' || paymentState === 'connection_error') && (
              <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-4 text-sm text-red-100">
                <p className="font-bold">
                  {paymentState === 'failed' ? 'Payment failed' : 'Connection error'}
                </p>
                <p className="mt-1 text-red-100/80">
                  {error ||
                    (paymentState === 'failed'
                      ? 'Donation was not completed. Your card was not charged.'
                      : 'We could not confirm the payment. You can safely retry.')}
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => runPaymentFlow(false)}
                    className="rounded-full bg-[#f1328b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
                  >
                    Safe retry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentState('idle');
                      setError('');
                      setStep(1);
                    }}
                    className="rounded-full border border-white/20 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80"
                  >
                    Change amount
                  </button>
                </div>
              </div>
            )}

            {(paymentState === 'idle' || paymentState === 'failed' || paymentState === 'connection_error') && (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="First name"
                    value={firstName}
                    onChange={setFirstName}
                    error={fieldErrors.firstName}
                    disabled={isReturning && Boolean(authenticatedDonor?.firstName)}
                  />
                  <Field
                    label="Last name"
                    value={lastName}
                    onChange={setLastName}
                    error={fieldErrors.lastName}
                    disabled={isReturning && Boolean(authenticatedDonor?.lastName)}
                  />
                </div>
                <div className="mt-4">
                  <Field
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    error={fieldErrors.email}
                    disabled={isReturning}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setOptionalOpen((v) => !v)}
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/80"
                >
                  <span>+ Add dedication or donation preferences</span>
                  <ChevronDown className={`h-4 w-4 transition ${optionalOpen ? 'rotate-180' : ''}`} />
                </button>

                {optionalOpen && (
                  <div className="mt-3 space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <label className="flex items-center gap-3 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-4 w-4 accent-[#f1328b]"
                      />
                      Donate anonymously
                    </label>

                    <fieldset>
                      <legend className="text-sm text-white/55">Dedication</legend>
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
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                              dedicationType === value
                                ? 'border-[#f1328b]/60 bg-[#f1328b]/15 text-white'
                                : 'border-white/10 text-white/65'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {dedicationType !== 'NONE' && (
                        <div className="mt-3">
                          <Field
                            label="Dedication name"
                            value={dedicationName}
                            onChange={setDedicationName}
                            error={fieldErrors.dedicationName}
                          />
                        </div>
                      )}
                    </fieldset>

                    <label className="block text-sm text-white/55">
                      Personal message
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-[#f1328b]/60"
                      />
                    </label>

                    <label className="flex items-center gap-3 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="h-4 w-4 accent-[#f1328b]"
                      />
                      Send me LoveCry updates
                    </label>
                  </div>
                )}

                <div className="mt-5">
                  <p className="text-sm text-white/55">Payment</p>
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f1328b]">
                      Zeffy secure payment
                    </p>
                    {embedUrl ? (
                      <div className="mt-3">
                        <ZeffyDonationEmbed
                          campaignId={campaign.id}
                          campaignName={campaign.name}
                          embedUrl={embedUrl}
                        />
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-white/55">
                        Development mode: LoveCry will simulate a secure Zeffy payment inside this page.
                        No card details are stored by LoveCry.
                      </p>
                    )}
                  </div>
                </div>

                <ReceiptBanner eligible={receiptEligiblePreview} thresholdCents={receiptThresholdCents} />

                <label className="mt-4 flex items-start gap-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#f1328b]"
                  />
                  <span>
                    I agree to LoveCry&apos;s donation and privacy terms. Zeffy securely processes the
                    payment inside this page.
                  </span>
                </label>
                {fieldErrors.privacyConsent && (
                  <p className="mt-2 text-sm text-red-300">{fieldErrors.privacyConsent}</p>
                )}

                <button
                  type="button"
                  disabled={submitLockRef.current}
                  onClick={() => {
                    if (!validateStep2()) return;
                    void runPaymentFlow(false);
                  }}
                  className="mt-6 w-full rounded-full bg-[#f1328b] px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  Donate {amountLabel}
                  {frequency === 'MONTHLY' ? ' / month' : ''}
                </button>
              </>
            )}
          </>
        )}
      </section>

      {campaignOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Close campaign selector"
            className="absolute inset-0"
            onClick={() => setCampaignOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-auto rounded-t-3xl border border-white/10 bg-[#0c0a12] p-5 sm:rounded-3xl sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Where your gift goes</h3>
              <button type="button" onClick={() => setCampaignOpen(false)} className="text-white/60">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {DEFAULT_CAMPAIGNS.map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setCampaignSlug(c.slug);
                      setCampaignOpen(false);
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      campaignSlug === c.slug
                        ? 'border-[#f1328b]/60 bg-[#f1328b]/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                    }`}
                  >
                    <span className="block font-semibold text-white">{c.name}</span>
                    <span className="mt-1 block text-sm text-white/50">{c.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm text-white/55">
      {label}
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-white outline-none disabled:opacity-70 ${
          error ? 'border-red-400/60' : 'border-white/10 focus:border-[#f1328b]/60'
        }`}
      />
      {error && <span className="mt-1 block text-sm text-red-300">{error}</span>}
    </label>
  );
}

function ReceiptBanner({
  eligible,
  thresholdCents,
}: {
  eligible: boolean;
  thresholdCents: number;
}) {
  return (
    <div
      className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        eligible
          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
          : 'border-white/10 bg-white/[0.03] text-white/60'
      }`}
    >
      {eligible ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : null}
      <span>
        {eligible
          ? 'Eligible for an official donation receipt.'
          : `Gifts under ${formatCadFromCents(thresholdCents)} receive email confirmation (not an official tax receipt).`}
      </span>
    </div>
  );
}

function PaymentStatusCard({ state }: { state: PaymentUiState }) {
  const copy: Record<Exclude<PaymentUiState, 'idle' | 'failed' | 'connection_error'>, string> = {
    loading: 'Connecting to Zeffy secure payment…',
    verifying: 'Verifying payment details…',
    processing: 'Processing your donation…',
  };
  if (state === 'idle' || state === 'failed' || state === 'connection_error') return null;
  return (
    <div className="mt-5 rounded-2xl border border-[#f1328b]/30 bg-[#f1328b]/10 px-4 py-4 text-sm text-white">
      <p className="font-bold">{copy[state]}</p>
      <p className="mt-1 text-white/60">Please keep this page open. Do not refresh or submit again.</p>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollUntilPaid(reference: string, attempts: number): Promise<boolean> {
  for (let i = 0; i < attempts; i += 1) {
    const res = await fetch(`/api/donations/${encodeURIComponent(reference)}/status`);
    if (res.ok) {
      const body = await res.json();
      if (body.status === 'PAID') return true;
    }
    await delay(700);
  }
  return false;
}
