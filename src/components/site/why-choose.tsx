import { Reveal } from '@/components/motion';
import { Users, Award, CalendarRange, PenLine, MessagesSquare, Sparkles } from 'lucide-react';
import { parsePairs, type SiteContent } from '@/lib/content';

const ICONS = [Users, CalendarRange, PenLine, MessagesSquare, Award, Sparkles];

export default function WhyChoose({ c }: { c: SiteContent }) {
  const items = parsePairs(c.why_items);
  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Stitched leather board */}
        <div
          className="relative overflow-hidden rounded-[36px] border border-[#0C0C12] px-6 py-16 sm:px-10 md:px-14 md:py-20"
          style={{
            backgroundImage:
              'radial-gradient(38rem 24rem at 85% 0%, rgba(229,26,36,.16), transparent 62%), radial-gradient(30rem 22rem at 0% 100%, rgba(154, 156, 162,.13), transparent 60%), linear-gradient(178deg,#333339,#24242A 55%,#18181E)',
            boxShadow:
              'inset 0 2px 0 rgba(255,255,255,.12), inset 0 -3px 0 rgba(0,0,0,.55), 0 3px 6px rgba(22, 22, 28,.28), 0 34px 60px -30px rgba(22, 22, 28,.8)',
          }}
        >
          {/* stitching + rivets */}
          <div className="pointer-events-none absolute inset-3 rounded-[28px] border border-dashed border-[#79797F]/45" />
          {[
            'left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3',
          ].map((pos) => (
            <span
              key={pos}
              className={`pointer-events-none absolute ${pos} h-2.5 w-2.5 rounded-full brass shadow-[inset_0_1px_1px_rgba(255,255,255,.7),0_1px_2px_rgba(0,0,0,.6)]`}
            />
          ))}

          <div className="relative">
            <Reveal><p className="text-[11.5px] font-[750] uppercase tracking-[0.22em] text-[#C6C8CE]">{c.why_eyebrow}</p></Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 max-w-2xl text-[clamp(2rem,4.4vw,3.4rem)] font-[800] leading-[1.05] tracking-[-0.03em] text-[#EDEFEF]">
                {c.why_title}
                <span className="font-serif-accent font-normal italic tracking-normal text-[#AFB1B7]"> {c.why_title_accent}</span>
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {items.map((item, i) => {
                const Icon = ICONS[i % ICONS.length];
                const big = i === 0;
                return (
                  <Reveal key={item.a + i} delay={0.06 * i} className={big ? 'md:row-span-2' : ''}>
                    <div
                      className={`group relative h-full overflow-hidden rounded-[24px] border border-[#404046] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-[#79797F] ${
                        big ? 'flex flex-col justify-between' : ''
                      }`}
                      style={{
                        backgroundImage: 'linear-gradient(178deg,#414147,#2C2C32 60%,#1F1F25)',
                        boxShadow:
                          'inset 0 1px 0 rgba(255,255,255,.14), inset 0 -2px 0 rgba(0,0,0,.5), 0 10px 20px -14px rgba(0,0,0,.8)',
                      }}
                    >
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#77777D] text-[#2C2C32] transition-transform duration-500 group-hover:scale-105"
                        style={{
                          backgroundImage: 'linear-gradient(180deg,#DDE2E9,#B4BBC5 58%,#8B93A0)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7), inset 0 -2px 0 rgba(66, 66, 72,.5), 0 6px 12px -6px rgba(0,0,0,.8)',
                        }}
                      >
                        <Icon size={20} />
                      </span>
                      <div className={big ? 'mt-16 md:mt-28' : 'mt-6'}>
                        <h3 className="text-[17px] font-[750] tracking-tight text-[#EDEFEF]">{item.a}</h3>
                        <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#A7A9AF]">{item.b}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
