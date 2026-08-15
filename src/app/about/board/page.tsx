import type { Metadata } from 'next';
import Link from 'next/link';
import { orgInfo } from '@/lib/org-info';

export const metadata: Metadata = {
  title: 'Board of Directors | LoveCry',
  description:
    'Board of directors information for LOVECRY THE STREET KIDS ORGANIZATION, a registered Canadian charity.',
};

export default function BoardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#040206] via-[#050305] to-[#050505] text-white">
      <section className="relative bg-gradient-to-r from-[#693492] via-[#9a3d8f] to-[#f1328b] px-6 pb-16 pt-28 text-center sm:pb-20 sm:pt-32">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/80">About Us</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Board of Directors</h1>
      </section>

      <section className="px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-base leading-relaxed text-white/75 sm:text-lg">
            {orgInfo.legalName} is governed with a commitment to integrity, accountability,
            transparency, and responsible stewardship of charitable resources.
          </p>

          <article className="mt-10 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.35em] text-[#f1328b]">Director</h2>
            <h3 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Nesha Mohammed
            </h3>
            <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-white/55">
              Director
            </p>
            <p className="mt-6 text-base leading-relaxed text-white/70">
              Nesha Mohammed provides governance oversight and organizational leadership in support of
              LoveCry&apos;s charitable mission and community programs.
            </p>
          </article>

          <div className="mt-10 text-center">
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Back to Our Story
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
