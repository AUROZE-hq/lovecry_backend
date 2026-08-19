import { orgInfo } from '@/lib/org-info';

export default function BoardSection() {
  return (
    <section id="board" className="scroll-mt-28">
      <section className="relative bg-gradient-to-r from-[#693492] via-[#9a3d8f] to-[#f1328b] px-6 pb-16 pt-28 text-center sm:pb-20 sm:pt-32">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/80">About Us</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Board of Directors</h2>
      </section>

      <section className="px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-base leading-relaxed text-white/75 sm:text-lg">
            {orgInfo.legalName} is governed with a commitment to integrity, accountability, transparency, and
            responsible stewardship of charitable resources.
          </p>

          <article className="mt-10 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <h3 className="text-sm font-bold uppercase tracking-[0.35em] text-[#f1328b]">Director</h3>
            <h4 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">Nesha Mohammed</h4>
            <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-white/55">Director</p>
            <p className="mt-6 text-base leading-relaxed text-white/70">
              Nesha Mohammed provides governance oversight and organizational leadership in support of LoveCry&apos;s
              charitable mission and community programs.
            </p>
          </article>
        </div>
      </section>
    </section>
  );
}
