import BookNowWizard from '@/components/counselling/BookNowWizard';
import { CalendarClock, HeartHandshake, ShieldCheck } from 'lucide-react';
import { orgInfo } from '@/lib/org-info';

export const metadata = {
  title: 'Book Now | LoveCry Counselling',
  description: 'Book a LoveCry counselling appointment online without leaving lovecry.ca.',
};

const highlights = [
  {
    icon: CalendarClock,
    title: 'One-hour sessions',
    text: 'Individual counselling with flexible virtual, phone, or in-person options.',
  },
  {
    icon: ShieldCheck,
    title: 'Stay on LoveCry.ca',
    text: 'No redirects to external booking sites — the full flow happens here.',
  },
  {
    icon: HeartHandshake,
    title: 'Trauma-informed care',
    text: 'Support from LoveCry counsellors who understand youth and family needs.',
  },
];

export default function BookNowPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="relative overflow-hidden bg-gradient-to-r from-[#693492] via-[#9a3d8f] to-[#f1328b] px-6 pb-14 pt-[calc(var(--site-header-height)+2.5rem)] sm:pb-16 sm:pt-[calc(var(--site-header-height)+3rem)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-black/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/85">
            {orgInfo.shortName} Counselling
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Book Now</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
            Schedule a one-hour counselling session. The full flow stays on LoveCry.ca — no redirects
            to external booking sites.
          </p>
        </div>
      </section>

      <section className="relative px-6 pb-24 pt-10 sm:pt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(105,52,146,0.18),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(241,50,139,0.12),_transparent_45%)]"
        />

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#f1328b]/15 text-[#f1328b]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="mt-3 text-sm font-bold text-white">{title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{text}</p>
              </div>
            ))}
          </div>

          <BookNowWizard />
        </div>
      </section>
    </main>
  );
}
