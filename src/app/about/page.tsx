"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Heart,
} from 'lucide-react';
import BoardSection from '@/components/about/BoardSection';
import TransparencyContent from '@/components/about/TransparencyContent';
import { orgInfo } from '@/lib/org-info';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#040206] via-[#050305] to-[#050505] text-white overflow-hidden">
      <section id="our-story" className="relative mx-auto flex max-w-7xl items-center px-6 pt-28 pb-10 sm:pt-30 sm:pb-12 lg:min-h-[calc(100svh-7rem)] lg:pt-28 lg:pb-14 xl:pt-30 xl:pb-16">
        {/* Animated decorative glows for richer dark theme */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3], x: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -left-28 -top-24 z-0 w-72 h-72 rounded-full bg-gradient-to-tr from-[#693492]/30 to-[#f1328b]/18 blur-3xl"
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.45, 0.2], x: [0, -18, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="pointer-events-none absolute -right-20 -bottom-10 z-0 w-96 h-96 rounded-full bg-gradient-to-bl from-[#f1328b]/24 to-[#693492]/18 blur-4xl"
        />
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 xl:gap-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.18, delayChildren: 0.08 } }
            }}
            className="relative max-w-2xl flex flex-col justify-center px-4 lg:px-8"
          >
            <div className="absolute -left-24 -top-10 hidden lg:block w-40 h-40 rounded-full bg-gradient-to-tr from-[#693492]/30 to-[#f1328b]/20 blur-3xl opacity-80 pointer-events-none" />

            <motion.p
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'anticipate' } } }}
              whileInView={{ scale: [0.995, 1, 1.005] }}
              viewport={{ once: true }}
              className="max-w-xl text-xl sm:text-2xl lg:text-3xl font-medium leading-[1.5] text-white/85 border-l-4 border-[#f1328b] pl-6 italic drop-shadow-lg"
            >
              "Empathy and understanding pave the path to heal shattered souls; LoveCry stands as the beacon guiding abused youth towards a brighter tomorrow."
            </motion.p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-lg xl:max-w-xl"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.7, 0.5]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-4 rounded-[2rem] bg-[#693492]/20 blur-3xl" 
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-4 top-8 h-28 w-28 rounded-full bg-[#f1328b]/20 blur-2xl" 
            />

            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-black p-2.5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] transition-transform duration-700 hover:scale-[1.03] hover:shadow-[0_48px_120px_rgba(241,50,139,0.26)]">
              <div className="relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-[#111] via-[#080808] to-[#111]">
                <div className="absolute left-5 top-5 z-10 rounded-full bg-black/80 border border-white/15 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-white/90 shadow-sm backdrop-blur transition-transform duration-500 group-hover:scale-105 group-hover:border-pink-500/50">
                  We are stronger than blood. We're a soul family
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                  whileHover={{ scale: 1.09, rotate: -0.8, y: -8 }}
                  transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }}
                  className="relative"
                >
                  <Image
                    src="/about.png"
                    alt={`${orgInfo.shortName} about illustration`}
                    width={1200}
                    height={900}
                    className="h-[280px] w-full object-cover sm:h-[330px] lg:h-[360px] xl:h-[390px] 2xl:h-[420px] opacity-85 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                    priority
                    unoptimized
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-pink-600/20" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="our-organization" className="relative border-y border-white/5 bg-[#080808] py-16 sm:py-20 scroll-mt-28">
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Our Organization</h2>
          <div className="mt-8 space-y-6 text-base leading-relaxed text-white/70 sm:text-lg">
            <p>{orgInfo.ourOrganizationParagraph}</p>
            <p>{orgInfo.ourOrganizationMission}</p>
            <p>{orgInfo.ourOrganizationWebsiteNote}</p>
          </div>
        </div>
      </section>

      <section id="ceo" className="relative bg-[#080808] border-y border-white/5 py-20 sm:py-24 overflow-hidden scroll-mt-28">
        {/* Background Decorative Blob */}
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-[#693492]/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] items-center">
            
            {/* CEO Text Area */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="order-2 lg:order-1 max-w-2xl"
            >
              <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                CEO
              </h2>
              
              <div className="mt-6 border-l-2 border-[#f1328b] pl-5">
                <p className="text-xl font-bold text-white">Jesse Wilson, RSW</p>
                <p className="mt-1 text-sm font-medium text-white/60">
                  Registered Social Worker | CCTP (I-II)
                  <br />
                  Chief Executive Officer
                </p>
              </div>

              <div className="mt-10 space-y-6 text-base leading-relaxed text-white/70">
                <p>
                  Jesse Wilson, CEO of LoveCry, is a Registered Social Worker certified in complex trauma. His deep commitment to advocacy is rooted in his own lived experience within the child welfare system. As a young father, Jesse faced profound personal challenges, including a long and difficult legal battle to preserve his relationship with his daughter. Despite years of separation caused by systemic barriers, they were reunited when she turned 18 and have since shared a close, unbreakable bond.
                </p>
                <p>
                  Jesse was mentored by LoveCry&apos;s founder, Angel, whose guidance helped shape his approach to leadership, healing, and community advocacy. This mentorship strengthened his dedication to creating safe, healing spaces where youth and families can find support, understanding, and empowerment.
                </p>
                <p>
                  His journey through adversity fuels his passion for fostering resilience, promoting mental health, and encouraging unconditional love — guiding others toward stability and self-worth through programs that address the emotional, physical, and spiritual well-being of the communities he serves.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="https://www.linkedin.com/in/jesse-wilson-94555b161/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:bg-[#0077b5] hover:text-white hover:border-[#0077b5] hover:scale-110 shadow-lg"
                  aria-label="LinkedIn Profile"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </Link>
              </div>
            </motion.div>

            {/* CEO Image */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="order-1 lg:order-2 relative mx-auto w-full max-w-md lg:max-w-lg"
            >
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-bl from-[#693492]/20 to-[#f1328b]/20 blur-3xl opacity-50" />
              
              <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
                <Image
                  src="/aboutceo.avif"
                  alt="Jesse Wilson, CEO of LoveCry"
                  width={800}
                  height={1000}
                  className="h-auto w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                  unoptimized
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      <section className="relative bg-[#050505] border-y border-white/5 py-20 sm:py-28 overflow-hidden">
        {/* Decorative Background Glows */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/3 w-[500px] h-[500px] bg-[#693492]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[500px] h-[500px] bg-[#f1328b]/15 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:gap-10 lg:grid-cols-2 items-stretch">
            
            {/* The Mission Card */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 sm:p-12 shadow-2xl backdrop-blur-xl transition-all duration-700 hover:border-[#693492]/50 hover:bg-white/[0.04] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(105,52,146,0.15)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#693492]/60 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#693492]/20 blur-[80px] opacity-40 transition-opacity duration-700 group-hover:opacity-70 pointer-events-none" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[#693492]/30 bg-gradient-to-br from-[#693492]/30 to-[#c492ef]/10 shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <div
                      className="absolute inset-y-0 left-0 w-0 rounded-2xl bg-gradient-to-r from-[#693492] to-[#c492ef] transition-[width] duration-700 ease-out group-hover:w-full"
                      aria-hidden="true"
                    />
                    <Heart className="relative z-10 h-5 w-5 text-[#c492ef] transition-colors duration-500 group-hover:text-white" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-[0.35em] text-[#c492ef]">The Mission</span>
                </div>
                
                <h2 className="mt-8 text-3xl font-black tracking-tight sm:text-4xl">
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50">A Nurturing Sanctuary</span>
                </h2>
                
                <p className="mt-6 flex-grow text-lg leading-relaxed text-white/60">
                  LoveCry empowers youth and families impacted by trauma, abuse, and systemic barriers by prioritizing mental health as the foundation for healing and growth. Through free and accessible programs like yoga, meditation, fitness, nutrition workshops, and peer-led discussions, we create safe, nonjudgmental spaces that nurture emotional resilience, self-worth, and community connection. Our mission is to ensure every participant has the tools, skills, and mental health supports they need to thrive.
                </p>

                <div className="mt-10 h-1 w-full max-w-[5rem] overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full origin-left scale-x-[0.35] rounded-full bg-gradient-to-r from-[#693492] to-[#c492ef] transition-transform duration-700 ease-out group-hover:scale-x-100" />
                </div>
              </div>
            </motion.div>

            {/* The Vision Card */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="group relative overflow-hidden rounded-[2.5rem] border border-[#f1328b]/20 bg-gradient-to-br from-[#1a0a14] to-[#050505] p-8 sm:p-12 shadow-2xl backdrop-blur-xl transition-all duration-700 hover:border-[#f1328b]/50 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(241,50,139,0.15)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f1328b]/60 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#f1328b]/20 blur-[80px] opacity-40 transition-opacity duration-700 group-hover:opacity-70 pointer-events-none" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[#f1328b]/30 bg-gradient-to-br from-[#f1328b]/30 to-[#f1328b]/5 shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <div
                      className="absolute inset-y-0 left-0 w-0 rounded-2xl bg-gradient-to-r from-[#f1328b] to-[#f1328b]/70 transition-[width] duration-700 ease-out group-hover:w-full"
                      aria-hidden="true"
                    />
                    <Sparkles className="relative z-10 h-5 w-5 text-[#f1328b] transition-colors duration-500 group-hover:text-white" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-[0.35em] text-[#f1328b]">The Vision</span>
                </div>
                
                <h2 className="mt-8 text-3xl font-black tracking-tight sm:text-4xl">
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-[#f1328b]/70">Our Future Dream</span>
                </h2>
                
                <p className="mt-6 flex-grow text-lg leading-relaxed text-white/60 group-hover:text-white/70 transition-colors duration-500">
                  We envision a future where mental health support is not a privilege but a right where every young person, regardless of background or circumstance, feels seen, valued, and capable of achieving their goals. LoveCry is committed to breaking cycles of abuse, neglect, and homelessness by fostering family unity, resilience, and holistic wellness. Through unconditional love, empowerment, and accessible mental health care, we aim to transform lives and strengthen communities.
                </p>

                <div className="mt-10 h-1 w-full max-w-[5rem] overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full origin-left scale-x-[0.35] rounded-full bg-gradient-to-r from-[#f1328b] to-[#f1328b]/40 transition-transform duration-700 ease-out group-hover:scale-x-100" />
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      

      <section className="relative bg-[#050505] border-y border-white/5 py-20 sm:py-28 overflow-hidden">
        {/* Background Decorative Blob */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-[#693492]/10 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative mx-auto w-full max-w-xl lg:max-w-none"
          >
            {/* Image Glow */}
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[#693492]/30 to-[#f1328b]/20 blur-3xl opacity-50" />
            
            <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
              <Image
                src="/about2.png"
                alt={`${orgInfo.shortName} community support`}
                width={1200}
                height={900}
                className="h-[360px] w-full object-cover sm:h-[460px] lg:h-[540px] opacity-90 transition-transform duration-700 group-hover:scale-105"
                unoptimized
              />

              <div className="absolute bottom-6 left-6 rounded-2xl border border-white/10 bg-black/60 p-5 shadow-2xl backdrop-blur-xl transition-all duration-500 group-hover:bg-black/70 group-hover:border-white/20">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#693492] to-[#f1328b] shadow-inner shrink-0">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight text-white drop-shadow-md">Community-Led Care</p>
                    <p className="mt-0.5 max-w-[220px] text-xs font-medium leading-5 text-white/80">
                      Supporting youth and families across the Greater Toronto Area.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl relative z-10"
          >
            <div className="inline-flex w-fit items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f1328b]/30 bg-gradient-to-br from-[#f1328b]/25 to-[#693492]/15 shadow-[0_0_25px_rgba(241,50,139,0.25)]">
                <Heart className="h-5 w-5 text-[#f1328b]" fill="currentColor" />
                <span className="absolute inset-0 rounded-2xl border border-[#f1328b]/40 animate-ping opacity-30" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-[0.35em] text-[#f1328b]">Why We Care</span>
                <span className="mt-1 h-px w-12 bg-gradient-to-r from-[#f1328b] to-transparent" />
              </div>
            </div>
            
            <h2 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.1]">
              We were founded to stand beside families who <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c492ef] to-[#f1328b]">need care most.</span>
            </h2>

            <div className="mt-8 space-y-6 text-base leading-relaxed text-white/70 sm:text-lg">
              <p>{orgInfo.about}</p>
              <p>
                Our work focuses on youth, families, and individuals affected by the child welfare system, offering
                healing-centered support that blends advocacy, mentorship, practical help, and community connection.
              </p>
              <p>
                From supportive programs to safe spaces for conversation and growth, we try to make every touchpoint
                feel steady, welcoming, and human.
              </p>
            </div>

            {/* <div className="mt-10">
              <Link
                href="/contact"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-7 py-4 text-sm font-bold text-white shadow-[0_10px_30px_rgba(241,50,139,0.3)] transition-all hover:scale-105 hover:shadow-[0_15px_40px_rgba(241,50,139,0.4)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform duration-300 group-hover:translate-y-0" />
                <span className="relative">Read Our Full History</span>
                <BookOpen className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div> */}
          </motion.div>
        </div>
      </section>

      <BoardSection />
      <TransparencyContent />

      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8 }}
        className="px-6 pb-20 pt-4 sm:pb-24 lg:pb-28 bg-[#050505]"
      >
        <div className="mx-auto max-w-7xl rounded-[2.25rem] bg-gradient-to-r from-[#693492] via-[#bd338e] to-[#f1328b] px-6 py-12 text-center text-white shadow-[0_25px_60px_rgba(241,50,139,0.25)] sm:px-10 sm:py-14 lg:px-16 lg:py-16 border border-white/10">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Ready to join our family?</h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-white/90 sm:text-lg">
            Connect with LoveCry to visit, learn more about our programs, and see how we create safer, stronger
            spaces for young people and families.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/book-now"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black shadow-lg transition hover:bg-slate-100"
            >
              Book now
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
            >
              View Programs
            </Link>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-white/80 sm:flex-row sm:gap-6">
            <a href={orgInfo.phoneHref} className="transition hover:text-white">
              {orgInfo.phone}
            </a>
            <a href={orgInfo.emailHref} className="transition hover:text-white">
              {orgInfo.email.toLowerCase()}
            </a>
          </div>
        </div>
      </motion.section>
    </main>
  );
}