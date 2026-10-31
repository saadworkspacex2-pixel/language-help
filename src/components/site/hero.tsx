'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react';
import { parsePairs, type SiteContent } from '@/lib/content';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Hero({ c }: { c: SiteContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const stats = parsePairs(c.hero_stats).slice(0, 4);
  const langs = c.hero_marquee.split(',').map((s) => s.trim()).filter(Boolean);

  /* The CMS "overlay" value now controls how much warm WHITE veils the photo.
     Default 72 → 72% white. Never below 55% so ink text stays readable. */
  const white = Math.min(94, Math.max(55, Number(c.hero_overlay || 72)));
  const veil = white / 100;
  const alignLeft = c.hero_align === 'left';

  return (
    <section ref={ref} className="relative isolate w-full overflow-hidden bg-[#E6E8EE]">
      {/* ---------- Photograph ---------- */}
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0 -z-20">
        <motion.img
          src={c.hero_bg_image}
          alt=""
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease }}
          className="h-full w-full object-cover"
        />
      </motion.div>

      {/* ---------- Warm white veil (was black) ---------- */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(243, 245, 245, ${veil})`,
            backdropFilter: 'blur(2px) saturate(108%)',
            WebkitBackdropFilter: 'blur(2px) saturate(108%)',
          }}
        />
        {/* parchment gradient so the photo melts into the page */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F7F7]/45 via-transparent to-[#E3E5EB]/95" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#DEE0E6] to-transparent" />
        <div className="absolute -top-24 left-1/2 h-72 w-[52rem] -translate-x-1/2 rounded-full bg-white/55 blur-[90px]" />
        {/* faint brass warmth in the corners */}
        <div className="absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-[#9A9CA2]/12 blur-[90px]" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-[#E51A24]/10 blur-[100px]" />
      </div>

      {/* ---------- Content ---------- */}
      <div
        className={`relative mx-auto flex min-h-[clamp(620px,100svh,940px)] w-full max-w-7xl flex-col px-6 pb-14 pt-32 md:pt-36 ${
          alignLeft ? 'items-start text-left' : 'items-center text-center'
        }`}
      >
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className={`flex flex-1 flex-col justify-center ${alignLeft ? 'items-start' : 'items-center'}`}
        >
          {/* badge — a small stitched bone tag */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease }}
            className="inline-flex items-center gap-2.5 rounded-full border border-[#BEC0C6] px-4 py-2 text-[12px] font-[700] text-[#424248]"
            style={{
              backgroundImage: 'linear-gradient(180deg,#FFFFFF,#F5F7FA)',
              boxShadow: 'inset 0 1px 0 #fff, 0 2px 4px rgba(52, 52, 58,.12), 0 10px 20px -14px rgba(52, 52, 58,.5)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#E51A24] animate-pulse-dot shadow-[0_0_0_3px_rgba(229,26,36,.16)]" />
            {c.hero_badge}
          </motion.div>

          <h1 className="mt-8 max-w-5xl text-[clamp(2.5rem,6.6vw,5.4rem)] font-[800] leading-[1.02] tracking-[-0.038em] text-[#1E1E24] drop-shadow-[0_1px_0_rgba(255,255,255,.7)]">
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span className="block" initial={{ y: '110%' }} animate={{ y: '0%' }} transition={{ duration: 1.1, delay: 0.3, ease }}>
                {c.hero_title_1}
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span className="block" initial={{ y: '110%' }} animate={{ y: '0%' }} transition={{ duration: 1.1, delay: 0.44, ease }}>
                {c.hero_title_2}{' '}
                <span className="font-serif-accent font-normal italic tracking-normal text-[#E51A24]">{c.hero_title_accent}</span>
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, delay: 0.64, ease }}
            className={`mt-7 text-[15px] leading-[1.75] text-[#525258] md:text-[16.5px] ${alignLeft ? 'max-w-xl' : 'max-w-2xl'}`}
          >
            {c.hero_subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, delay: 0.78, ease }}
            className={`mt-10 flex flex-wrap items-center gap-3.5 ${alignLeft ? '' : 'justify-center'}`}
          >
            <Link href="/courses" className="btn btn-primary btn-lg gap-2">
              {c.hero_cta_primary} <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="btn btn-outline btn-lg gap-2">
              {c.hero_cta_secondary} <ArrowUpRight size={16} />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className={`mb-8 hidden md:block ${alignLeft ? 'self-start' : 'self-center'}`}
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
            <ChevronDown size={20} className="text-[#7D7D83]" />
          </motion.div>
        </motion.div>

        {/* ---------- Stat plinth ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.95, ease }}
          className="relative w-full rounded-[26px] border border-[#BEC0C6] px-4 py-5 sm:px-7"
          style={{
            backgroundImage: 'linear-gradient(178deg,#FFFFFF,#F7F9FA 58%,#EBEEF2)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,.95), inset 0 -2px 0 rgba(107, 107, 113,.14), 0 2px 3px rgba(52, 52, 58,.14), 0 22px 44px -22px rgba(52, 52, 58,.55)',
          }}
        >
          <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.b + i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.05 + i * 0.09, ease }}
                className={`flex flex-col items-center gap-0.5 px-2 text-center sm:flex-row sm:gap-3 sm:text-left ${
                  i < stats.length - 1 ? 'sm:border-r sm:border-[#C9CBD1] sm:shadow-[1px_0_0_rgba(255,255,255,.85)]' : ''
                }`}
              >
                <span className="text-[21px] font-[800] tracking-tight text-[#202026] md:text-[25px]">{s.a}</span>
                <span className="text-[11px] font-[600] leading-tight text-[#65656B]">{s.b}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ---------- Marquee ---------- */}
      <div
        className="relative border-t border-[#C2C4CA] py-4"
        style={{
          backgroundImage: 'linear-gradient(180deg,#F5F7F8,#EBEEF2)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(107, 107, 113,.14)',
        }}
      >
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
            {[...langs, ...langs].map((l, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                <span className={`text-[14.5px] font-[700] tracking-tight ${i % 2 ? 'text-[#96989E]' : 'text-[#333339]'}`}>{l}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#E51A24] shadow-[0_0_0_2px_rgba(229,26,36,.14)]" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
