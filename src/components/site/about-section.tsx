import { Reveal, ScaleIn } from '@/components/motion';
import { Quote, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { parsePairs, type SiteContent } from '@/lib/content';

export default function AboutSection({ c }: { c: SiteContent }) {
  const stats = parsePairs(c.about_stats);
  return (
    <section id="about" className="relative overflow-hidden py-24 md:py-32">
      {/* paper seams */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
      <div className="pointer-events-none absolute -right-40 top-24 h-96 w-96 rounded-full bg-[#9A9CA2]/10 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Story */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <p className="eyebrow">{c.about_eyebrow}</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 text-[clamp(2rem,4.4vw,3.4rem)] font-[800] leading-[1.04] tracking-[-0.03em] text-[#202026]">
                {c.about_title}
                <span className="font-serif-accent font-normal italic tracking-normal text-[#707076]"> {c.about_title_accent} </span>
                {c.about_title_end}
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 whitespace-pre-line text-[15.5px] leading-[1.8] text-[#65656B]">{c.about_body}</p>
            </Reveal>

            <Reveal delay={0.22}>
              <div className="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {stats.map((s, i) => (
                  <div
                    key={s.b + i}
                    className="rounded-[18px] border border-[#C6C8CE] px-3 py-4 text-center"
                    style={{
                      backgroundImage: 'linear-gradient(178deg,#FFFFFF,#F6F8F9 65%,#EAEDF1)',
                      boxShadow: 'inset 0 1px 0 #fff, 0 1px 2px rgba(52, 52, 58,.14), 0 8px 14px -10px rgba(52, 52, 58,.5)',
                    }}
                  >
                    <p className="text-[22px] font-[800] tracking-tight text-[#202026]">{s.a}</p>
                    <p className="mt-0.5 text-[11px] font-[650] text-[#65656B]">{s.b}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.28}>
              <Link href="/contact" className="btn btn-dark btn-md mt-9 gap-2">
                {c.about_cta} <ArrowUpRight size={15} />
              </Link>
            </Reveal>
          </div>

          {/* Mounted photographs */}
          <div className="relative space-y-6">
            <ScaleIn>
              <div className="frame">
                <img src={c.about_image_1} alt="Teaching at LHBD" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              </div>
            </ScaleIn>
            <div className="grid grid-cols-[0.9fr_1.1fr] gap-6">
              <ScaleIn delay={0.1}>
                <div className="frame h-full">
                  <img src={c.about_image_2} alt="Students studying" className="aspect-[3/4] h-full w-full object-cover" loading="lazy" />
                </div>
              </ScaleIn>
              <ScaleIn delay={0.18} className="flex items-end">
                <div
                  className="stitch relative w-full rounded-[24px] border border-[#C6C8CE] p-7"
                  style={{
                    backgroundImage: 'linear-gradient(178deg,#FFFFFF,#F7F9FA 60%,#EDF0F4)',
                    boxShadow: 'inset 0 1px 0 #fff, 0 2px 4px rgba(52, 52, 58,.12), 0 22px 40px -22px rgba(52, 52, 58,.55)',
                  }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#77777D] brass shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_2px_4px_rgba(96, 96, 102,.4)]">
                    <Quote size={15} className="text-[#3B3B41]" />
                  </span>
                  <p className="mt-4 font-serif-accent text-[19px] italic leading-snug text-[#25252B]">“{c.about_quote}”</p>
                  <div className="divider-rule my-4" />
                  <p className="text-[12.5px] font-[650] text-[#65656B]">{c.about_quote_author}</p>
                </div>
              </ScaleIn>
            </div>
            <ScaleIn delay={0.08}>
              <div className="frame">
                <img src={c.about_image_3} alt="Discussion in class" className="aspect-[21/9] w-full object-cover" loading="lazy" />
              </div>
            </ScaleIn>
          </div>
        </div>
      </div>
    </section>
  );
}
