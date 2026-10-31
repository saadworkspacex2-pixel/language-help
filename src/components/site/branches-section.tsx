import { MapPin, Phone, Navigation } from 'lucide-react';
import { Reveal, ScaleIn } from '@/components/motion';
import type { branches } from '@/db/schema';
import type { SiteContent } from '@/lib/content';

type Branch = typeof branches.$inferSelect;

export default function BranchesSection({ items, c }: { items: Branch[]; c: SiteContent }) {
  const main = items.find((b) => b.isMain) ?? items[0];
  const embed = main?.mapEmbed || 'https://www.google.com/maps?q=Dhanmondi,+Dhaka,+Bangladesh&output=embed';
  return (
    <section id="branches" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/60" />
      <div className="mx-auto max-w-7xl px-6">
        <Reveal><p className="eyebrow">{c.branches_eyebrow}</p></Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-5 max-w-xl text-[clamp(2rem,4.4vw,3.4rem)] font-[800] leading-[1.05] tracking-[-0.03em] text-[#202026]">
            {c.branches_title}
            <span className="font-serif-accent font-normal italic tracking-normal text-[#707076]"> {c.branches_title_accent}</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-7 lg:grid-cols-[1.5fr_1fr]">
          <ScaleIn>
            <div className="frame h-full !p-3">
              <iframe src={embed} title="LHBD map" className="h-full min-h-[380px] w-full border-0" loading="lazy" />
            </div>
          </ScaleIn>

          <div className="space-y-4">
            {items.map((b, i) => (
              <Reveal key={b.id} delay={0.07 * i}>
                <div
                  className={`card-hover rounded-[24px] border p-6 ${
                    b.isMain ? 'border-[#0C0C12] text-[#EDEFEF]' : 'glass-soft'
                  }`}
                  style={
                    b.isMain
                      ? {
                          backgroundImage: 'linear-gradient(178deg,#333339,#24242A 58%,#18181E)',
                          boxShadow:
                            'inset 0 1px 0 rgba(255,255,255,.14), inset 0 -2px 0 rgba(0,0,0,.55), 0 20px 40px -22px rgba(22, 22, 28,.85)',
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-[15.5px] font-[750] tracking-tight ${b.isMain ? 'text-[#EDEFEF]' : 'text-[#202026]'}`}>{b.name}</p>
                    {b.isMain && (
                      <span
                        className="rounded-full border border-[#77777D] px-2.5 py-0.5 text-[10px] font-[800] uppercase tracking-wide text-[#2C2C32]"
                        style={{ backgroundImage: 'linear-gradient(180deg,#DDE2E9,#B4BBC5 60%,#8B93A0)' }}
                      >
                        Main
                      </span>
                    )}
                  </div>
                  <p className={`mt-2.5 flex items-start gap-2 text-[13px] leading-relaxed ${b.isMain ? 'text-[#AFB1B7]' : 'text-[#65656B]'}`}>
                    <MapPin size={14} className="mt-0.5 shrink-0 text-[#E51A24]" /> {b.address}
                  </p>
                  {b.phone && (
                    <p className={`mt-1.5 flex items-center gap-2 text-[13px] ${b.isMain ? 'text-[#AFB1B7]' : 'text-[#65656B]'}`}>
                      <Phone size={14} className="shrink-0 text-[#E51A24]" /> {b.phone}
                    </p>
                  )}
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.2}>
              <a href="https://maps.google.com/?q=Dhanmondi,Dhaka,Bangladesh" target="_blank" className="btn btn-dark btn-md w-full gap-2">
                <Navigation size={15} /> Get directions
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
