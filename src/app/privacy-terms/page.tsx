'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { orgInfo } from '@/lib/org-info';

function PrivacyTermsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/book-now';

  function acceptAndReturn() {
    const target = new URL(returnTo, window.location.origin);
    target.searchParams.set('privacyAccepted', '1');
    router.push(`${target.pathname}${target.search}${target.hash}`);
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="px-4 pb-10 pt-[calc(var(--site-header-height)+2rem)] sm:px-6 sm:pt-[calc(var(--site-header-height)+2.5rem)]">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f1328b]">Legal</p>
          <h1 className="font-hero mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Privacy Terms</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
            These Privacy Terms explain how {orgInfo.legalName} (&quot;LoveCry&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses, and
            protects personal information related to counselling bookings and related services on {orgInfo.website}.
          </p>
          <p className="mt-3 text-sm text-white/45">
            Placeholder content for now. LoveCry will update this page with the full privacy policy later.
          </p>
        </div>
      </section>

      <section className="px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8 text-sm leading-relaxed text-white/70 sm:text-base">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">1. Information we collect</h2>
            <p className="mt-3">
              When you book counselling or contact us, we may collect your name, email address, phone number, preferred
              appointment details, and any information you choose to share about your needs.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">2. How we use your information</h2>
            <p className="mt-3">
              We use your information to schedule and manage appointments, communicate about your booking, provide
              counselling-related services, and meet legal or professional obligations.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">3. Confidentiality</h2>
            <p className="mt-3">
              Counselling information is treated as confidential, subject to applicable laws and professional standards,
              including exceptions such as risk of harm, child protection duties, or court orders.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">4. Sharing of information</h2>
            <p className="mt-3">
              We do not sell personal information. We may share limited information with trusted service providers (for
              example secure email, calendar, or hosting tools) only as needed to operate LoveCry services, or when
              required by law.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">5. Data retention and security</h2>
            <p className="mt-3">
              We keep booking and related records only as long as reasonably necessary for service delivery, legal
              compliance, and organizational records. We take reasonable steps to protect personal information from
              unauthorized access, loss, or misuse.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">6. Your choices</h2>
            <p className="mt-3">
              You may contact LoveCry to request access to, correction of, or questions about your personal information,
              subject to applicable law and counselling record requirements.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">7. Contact</h2>
            <p className="mt-3">
              For privacy questions, contact LoveCry at{' '}
              <a href={orgInfo.emailHref} className="text-[#60a5fa] underline underline-offset-2 hover:text-[#93c5fd]">
                {orgInfo.email.toLowerCase()}
              </a>{' '}
              or through our{' '}
              <Link href="/contact" className="text-[#60a5fa] underline underline-offset-2 hover:text-[#93c5fd]">
                contact page
              </Link>
              .
            </p>
          </article>

          <div className="sticky bottom-4 rounded-[1.5rem] border border-white/10 bg-[#0c0a12]/95 p-4 shadow-2xl backdrop-blur sm:p-5">
            <p className="text-sm text-white/60">
              By selecting Accept, you confirm that you have read these Privacy Terms and can continue booking.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={acceptAndReturn}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[#f1328b] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110"
              >
                Accept and continue booking
              </button>
              <Link
                href={returnTo}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-white/20 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white/80 transition hover:bg-white/5"
              >
                Back without accepting
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PrivacyTermsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#050505] px-4 pt-[calc(var(--site-header-height)+2rem)] text-white/55">
          Loading privacy terms…
        </main>
      }
    >
      <PrivacyTermsContent />
    </Suspense>
  );
}
