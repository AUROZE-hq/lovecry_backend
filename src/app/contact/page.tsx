"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, Heart } from "lucide-react";
import { orgInfo } from "@/lib/org-info";

const inputClassName =
  "mt-1 block w-full border-0 border-b-2 border-white/50 bg-white/[0.07] px-3 py-3.5 text-base text-white placeholder:text-white/45 outline-none transition focus:border-[#f1328b] focus:bg-white/[0.12]";

const labelClassName = "block text-sm font-semibold tracking-wide text-white";

export default function ContactPage() {
  const mapQuery = encodeURIComponent(orgInfo.address);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#693492] via-[#9a3d8f] to-[#f1328b] px-6 pb-16 pt-28 text-center sm:pb-20 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl"
        >
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Contact</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
            {orgInfo.contactIntro}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Reach out to us to learn more about our mission or how you can get involved in supporting
            children&apos;s futures.
          </p>
        </motion.div>
      </section>

      {/* Get in Touch */}
      <section className="group relative overflow-hidden bg-[#050505] px-6 py-14 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[url('/bgContact.png')] bg-cover bg-center bg-no-repeat opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[#050505] transition-opacity duration-700 ease-out group-hover:opacity-65"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Get in Touch</h2>

            <div className="mt-6 space-y-4">
              <a
                href={`https://maps.google.com/?q=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-white/85 transition hover:text-white"
              >
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#f1328b]" />
                <span>{orgInfo.address}</span>
              </a>
              <a
                href={orgInfo.emailHref}
                className="flex items-start gap-3 text-white/85 transition hover:text-white"
              >
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#f1328b]" />
                <span>{orgInfo.email.toLowerCase()}</span>
              </a>
              <a
                href={orgInfo.phoneHref}
                className="flex items-start gap-3 text-white/85 transition hover:text-white"
              >
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#f1328b]" />
                <span>{orgInfo.phone}</span>
              </a>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-10 space-y-6"
              aria-label="Contact form"
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label className={labelClassName}>
                  First Name *
                  <input name="firstName" required aria-required className={inputClassName} />
                </label>
                <label className={labelClassName}>
                  Last Name *
                  <input name="lastName" required aria-required className={inputClassName} />
                </label>
              </div>

              <label className={labelClassName}>
                Email *
                <input name="email" type="email" required aria-required className={inputClassName} />
              </label>

              <label className={labelClassName}>
                Subject
                <input name="subject" className={inputClassName} />
              </label>

              <label className={labelClassName}>
                Type Your Message Here
                <textarea name="message" rows={5} className={`${inputClassName} resize-none`} />
              </label>

              <button
                type="submit"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
              >
                Send
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/10"
          >
            <Image
              src="/contactimage.png"
              alt="Children supported by LoveCry"
              width={800}
              height={1000}
              className="h-full min-h-[420px] w-full object-cover lg:min-h-[640px]"
              unoptimized
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 sm:p-8">
              <div className="rounded-2xl border border-white/10 bg-black/70 p-5 backdrop-blur-sm sm:p-6">
                <p className="text-base italic leading-relaxed text-white/90 sm:text-lg">
                  &ldquo;Together, we can provide the support and care every child deserves.&rdquo;
                </p>
                <p className="mt-3 text-sm font-semibold text-[#f1328b]">— The {orgInfo.shortName} Team</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Map */}
      <section className="border-t border-white/5 px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Visit Our Office</h2>
          <p className="mt-3 text-white/60">{orgInfo.address}</p>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
            <iframe
              title="LoveCry office location"
              src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-[320px] w-full sm:h-[400px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="support-options"
        className="bg-gradient-to-r from-[#693492] via-[#9a3d8f] to-[#f1328b] px-6 py-14 text-center sm:py-16"
      >
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">We Need Your Support Today!</h2>
        <Link
          href="/donate"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#693492] shadow-lg transition hover:bg-white/90"
        >
          <Heart className="h-4 w-4" />
          Donate Now
        </Link>
      </section>
    </main>
  );
}
