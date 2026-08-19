'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink, Download, FileText } from 'lucide-react';
import { FINANCIAL_REPORT_FILENAME, FINANCIAL_REPORT_PDF } from '@/lib/about-nav';
import { orgInfo } from '@/lib/org-info';

export default function TransparencyContent() {
  return (
    <section id="transparency-governance" className="scroll-mt-28">
      <section className="relative bg-gradient-to-r from-[#693492] via-[#9a3d8f] to-[#f1328b] px-6 pb-16 pt-28 text-center sm:pb-20 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/80">About Us</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Transparency &amp; Governance</h2>
        </motion.div>
      </section>

      <section className="relative px-6 py-14 sm:py-20">
        <div className="pointer-events-none absolute -left-28 top-0 h-72 w-72 rounded-full bg-gradient-to-tr from-[#693492]/20 to-[#f1328b]/10 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base leading-relaxed text-white/75 sm:text-lg"
          >
            {orgInfo.legalName} is committed to transparency, accountability, ethical governance, and responsible
            stewardship of charitable resources.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-4 text-base leading-relaxed text-white/65 sm:text-lg"
          >
            This page provides organizational and financial information so our community, supporters, donors, and
            partners can understand LoveCry&apos;s activities and use of resources.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14"
          >
            <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Financial Reports</h3>

            <article className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#f1328b]/30 bg-gradient-to-br from-[#693492]/30 to-[#f1328b]/20"
                  aria-hidden
                >
                  <FileText className="h-6 w-6 text-[#f1328b]" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xl font-black tracking-tight text-white sm:text-2xl">2021 Financial Summary</h4>
                  <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
                    This report provides a summary of cash donations, expenditures, and gifts-in-kind recorded by
                    LOVECRY THE STREET KIDS ORGANIZATION during the 2021 reporting year.
                  </p>

                  <p className="sr-only">PDF document: 2021 Financial Summary</p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <a
                      href={FINANCIAL_REPORT_PDF}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View 2021 Financial Summary PDF report in a new tab"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(241,50,139,0.25)] transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]"
                    >
                      <FileText className="h-4 w-4" aria-hidden />
                      View Report
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </a>

                    <a
                      href={FINANCIAL_REPORT_PDF}
                      download={FINANCIAL_REPORT_FILENAME}
                      aria-label="Download 2021 Financial Summary PDF report"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <FileText className="h-4 w-4" aria-hidden />
                      Download PDF
                      <Download className="h-4 w-4" aria-hidden />
                    </a>
                  </div>
                </div>
              </div>
            </article>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 space-y-4 text-base leading-relaxed text-white/65"
          >
            <p>Additional reports and governance information will be published as they become available.</p>
            <p>
              For questions regarding our governance, charitable activities, or organizational information, please
              contact LoveCry through our{' '}
              <Link
                href="/contact"
                className="font-semibold text-[#f1328b] underline decoration-[#f1328b]/40 underline-offset-4 transition hover:text-white hover:decoration-white"
              >
                official contact page
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </section>
    </section>
  );
}
