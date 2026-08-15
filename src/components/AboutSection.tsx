'use client';

import { motion } from 'framer-motion';
import { orgInfo } from '@/lib/org-info';
import { Heart, Target, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="about" className="relative w-full bg-[#050505] py-16 sm:py-24 lg:py-40 overflow-hidden flex items-center justify-center">
      {/* Background Glows with Animation (Optimized for performance) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            y: [0, -15, 0],
            scale: [1, 1.03, 1],
            opacity: [0.3, 0.4, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] left-[-15%] w-[60%] h-[50%] rounded-full bg-[#f1328b]/15 blur-[80px] md:blur-[120px] lg:blur-[150px] will-change-transform" 
        />
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[2%] right-[-15%] w-[70%] h-[40%] rounded-full bg-[#693492]/15 blur-[80px] md:blur-[120px] lg:blur-[150px] will-change-transform" 
        />
        {/* Subtle noise without heavy mix-blend-mode for better mobile performance */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] pointer-events-none" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 sm:gap-16 lg:gap-20 xl:gap-24 items-center">
        
        {/* Left Column: Editorial Narrative */}
        <div className="relative flex flex-col items-start z-10 w-full">
          
          {/* Huge Faded "ABOUT" Backdrop - Scaled safely for mobile and split-columns */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 0.04, x: -10 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute top-[-20px] sm:top-[-40px] left-[-10px] sm:left-[-20px] lg:left-[-40px] text-[6rem] sm:text-[9rem] md:text-[11rem] lg:text-[8rem] xl:text-[11rem] font-black leading-none text-white pointer-events-none select-none tracking-tighter"
          >
            ABOUT
          </motion.div>

          {/* Glass Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-2 sm:gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-4 sm:px-5 py-3 sm:py-3.5 mb-6 sm:mb-8 shadow-xl max-w-[540px]"
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f1328b] shrink-0" />
              <span className="text-white/90 text-[10px] sm:text-[11px] md:text-xs font-bold uppercase tracking-widest leading-snug">
                Official Website of {orgInfo.legalName}
              </span>
            </div>
            <div className="text-white/70 text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-wider leading-relaxed pl-6 sm:pl-6">
              Registered Canadian Charity · CRA Charity Number: {orgInfo.charityNumber}
            </div>
          </motion.div>
          
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="relative mb-6 sm:mb-8 w-full"
          >
            {/* Small radial glow strictly behind heading */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[#f1328b]/20 blur-[40px] md:blur-[60px] pointer-events-none rounded-full" />
            <h2 className="relative text-6xl sm:text-7xl md:text-[6rem] lg:text-[5rem] xl:text-[6.5rem] font-black z-10">
              <span
                className="brand-script normal-case tracking-normal leading-[0.9] bg-gradient-to-br from-white via-white to-gray-400 text-transparent bg-clip-text drop-shadow-sm block pb-2"
                style={{ fontFamily: '"Script MT", "Script MT Bold", "Brush Script MT", cursive' }}
              >
                {orgInfo.shortName}
              </span>
            </h2>
          </motion.div>

          {/* Paragraph */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl text-white/70 font-sans mb-6 sm:mb-8 max-w-[540px] leading-[1.7] sm:leading-[1.8] tracking-wide"
          >
            {orgInfo.officialWebsiteParagraph}
          </motion.p>

          {/* CRA Registration Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
            className="mb-8 sm:mb-10 w-full max-w-[540px] rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-md"
          >
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Registered Canadian Charity</h3>
            <dl className="mt-4 space-y-3 text-sm sm:text-base">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Legal name</dt>
                <dd className="mt-1 font-semibold text-white/90">{orgInfo.legalName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">CRA Charity Number</dt>
                <dd className="mt-1 font-semibold text-white/90">{orgInfo.charityNumber}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-white/60">{orgInfo.craCardSupportingText}</p>
          </motion.div>

          {/* Bullet Points */}
          <motion.ul 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
              hidden: {}
            }}
            className="space-y-4 sm:space-y-5 mb-10 sm:mb-12"
          >
            {[
              "Mental health support & counseling",
              "Skill-building & wellness programs",
              "Safe, inclusive healing spaces"
            ].map((item, index) => (
              <motion.li 
                key={index} 
                variants={{
                  hidden: { opacity: 0, x: -15 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
                }}
                className="flex items-center gap-4 sm:gap-5 text-[15px] sm:text-base md:text-lg lg:text-base xl:text-lg text-white/90 font-sans tracking-wide"
              >
                <div className="relative flex items-center justify-center w-2.5 sm:w-3 h-2.5 sm:h-3">
                  <span className="absolute w-full h-full bg-[#f1328b] rounded-full blur-[4px] sm:blur-[6px] opacity-60" />
                  <span className="relative w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white rounded-full" />
                </div>
                {item}
              </motion.li>
            ))}
          </motion.ul>

          {/* Button */}
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
            href="/about"
            className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 sm:px-8 py-3.5 sm:py-4 text-sm font-bold text-black transition-all hover:bg-gray-100 hover:scale-[1.02] shadow-[0_4px_20px_rgba(255,255,255,0.15)] w-full sm:w-auto"
          >
            <span className="relative z-10">Explore Details</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 scale-105 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
          </motion.a>
        </div>

        {/* Right Column: Mission Journey */}
        <div className="relative pt-8 sm:pt-12 lg:pt-0 w-full pl-0 sm:pl-[60px] lg:pl-[80px]">
          
          {/* Vertical Glowing Timeline Line */}
          <div className="absolute left-[30px] lg:left-[40px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent hidden sm:block" />
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
            className="absolute left-[29px] lg:left-[39px] top-[15%] h-[60%] w-[3px] hidden sm:block origin-top"
          >
            <motion.div
              className="absolute inset-0 origin-center bg-gradient-to-b from-[#f1328b]/0 via-[#f1328b] to-[#693492]/0 blur-[2px]"
              animate={{
                opacity: [0.25, 1, 0.35, 0.8, 0.25],
                scaleX: [1, 2.8, 1.15, 2, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.14, 0.26, 0.36, 1],
              }}
            />
            <motion.div
              className="absolute inset-0 origin-center bg-[#f1328b] blur-md"
              animate={{
                opacity: [0.08, 0.5, 0.12, 0.35, 0.08],
                scaleX: [1, 4.5, 1.4, 3.2, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.14, 0.26, 0.36, 1],
              }}
            />
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
              hidden: {}
            }}
            className="flex flex-col gap-4 sm:gap-5 xl:gap-6 relative z-10 w-full"
          >
            {/* Mission */}
            <JourneyCard 
              number="01"
              icon={<Heart className="w-4 h-4 sm:w-4 xl:w-5 sm:h-4 xl:h-5 text-white/80 transition-transform duration-500 group-hover:scale-110" />}
              title="Our Mission" 
              text="Empowering youth and families impacted by trauma, abuse, and systemic barriers through mental health support and long-term healing."
              align="left"
              hoverBackgroundImage="/mission.png"
            />
            {/* Focus - Staggered Right */}
            <JourneyCard 
              number="02"
              icon={<Target className="w-4 h-4 sm:w-4 xl:w-5 sm:h-4 xl:h-5 text-white/80 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />}
              title="Our Focus" 
              text="Through yoga, meditation, fitness, nutrition, and peer discussions, we create safe spaces that nurture resilience, self-worth, and community connection."
              align="right"
              hoverBackgroundImage="/focus.png"
            />
            {/* Impact - Highlighted */}
            <JourneyCard 
              number="03"
              icon={<Sparkles className="w-4 h-4 sm:w-4 xl:w-5 sm:h-4 xl:h-5 text-[#f1328b] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />}
              title="Our Impact" 
              text="Expanding access to compassionate counselling and emotional support for individuals, youth, and families experiencing trauma, hardship, or crisis."
              align="left"
              highlight
              hoverBackgroundImage="/impact.png"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}

function JourneyCard({
  number,
  icon,
  title,
  text,
  align,
  highlight = false,
  hoverBackgroundImage,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  align: 'left' | 'right';
  highlight?: boolean;
  hoverBackgroundImage?: string;
}) {
  const isRight = align === 'right';

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
      }}
      className="relative group w-full"
    >
      {/* Connector Dot to Timeline */}
      <div className="absolute top-[32px] sm:top-[36px] xl:top-[40px] w-2.5 h-2.5 rounded-full bg-[#050505] border-2 border-white/20 z-20 hidden sm:block group-hover:border-white transition-all duration-500 left-[-35px] lg:left-[-45px] group-hover:scale-125" />
      
      {/* Connector Line to Timeline */}
      <div className={`absolute top-[36px] sm:top-[40px] xl:top-[44px] h-[1px] bg-gradient-to-r from-transparent to-white/20 z-10 hidden sm:block group-hover:to-white/50 transition-colors duration-500 left-[-30px] lg:left-[-40px] ${isRight ? 'w-[60px] lg:w-[90px]' : 'w-[30px] lg:w-[40px]'}`} />

      {/* Main Card Container with Stagger */}
      <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/5 backdrop-blur-md sm:backdrop-blur-xl p-5 sm:p-6 md:p-7 xl:p-8 shadow-xl sm:shadow-2xl transition-all duration-700 hover:scale-[0.98] ${hoverBackgroundImage ? 'bg-[#111111]/40 group-hover:border-white/15' : 'bg-[#111111]/40 hover:bg-[#151515]/80'} ${isRight ? 'sm:ml-[30px] lg:ml-[50px] w-full sm:w-[calc(100%-30px)] lg:w-[calc(100%-50px)]' : 'w-full'}`}>

        {hoverBackgroundImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-right bg-no-repeat opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
              style={{ backgroundImage: `url('${hoverBackgroundImage}')` }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#111111]/95 via-[#111111]/70 to-[#111111]/20 opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
              aria-hidden="true"
            />
          </>
        )}
        
        {/* Animated Gradient Border Glow */}
        <div className="absolute inset-[-1px] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#f1328b]/50 to-[#693492]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10 blur-sm" />
        <div className="absolute inset-[-1px] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10" />

        {/* Highlight Glow for Impact */}
        {highlight && (
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#f1328b]/10 to-[#693492]/5 pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`flex items-center justify-center w-10 h-10 xl:w-12 xl:h-12 rounded-full border border-white/5 transition-all duration-500 group-hover:border-white/20 ${highlight ? 'bg-[#f1328b]/10 border-[#f1328b]/20 shadow-[0_0_15px_rgba(241,50,139,0.2)] group-hover:bg-[#f1328b]/20' : 'bg-white/5 group-hover:bg-white/10'} backdrop-blur-md`}>
                {icon}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight transition-transform duration-500 group-hover:translate-x-1">
                {title}
              </h3>
            </div>
            <span className="text-xl sm:text-2xl font-black text-white/5 font-serif select-none transition-all duration-500 group-hover:text-white/20 group-hover:-translate-x-1">{number}</span>
          </div>
          
          <p className="text-sm sm:text-[15px] md:text-base text-white/60 leading-[1.6] sm:leading-relaxed font-sans mt-1 transition-colors duration-500 group-hover:text-white/80">
            {text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
