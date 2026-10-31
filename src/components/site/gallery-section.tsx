import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion';
import type { galleryItems } from '@/db/schema';
import type { SiteContent } from '@/lib/content';

type Item = typeof galleryItems.$inferSelect;

export default function GallerySection({ items, c }: { items: Item[]; c: SiteContent }) {
  if (!items.length) return null;
  const row = [...items, ...items];
  return (
    <section className="overflow-hidden py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal><p className="eyebrow">{c.gallery_eyebrow}</p></Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 text-[clamp(2rem,4.4vw,3.4rem)] font-[800] leading-[1.05] tracking-[-0.03em] text-[#202026]">
                {c.gallery_title}
                <span className="font-serif-accent font-normal italic tracking-normal text-[#E51A24]"> {c.gallery_title_accent}</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <Link href="/gallery" className="btn btn-outline btn-md gap-2">Open gallery <ArrowRight size={15} /></Link>
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.1}>
        <div className="mt-14 flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="animate-marquee-slow flex shrink-0 gap-6 pr-6 hover:[animation-play-state:paused]">
            {row.map((g, i) => (
              <div
                key={`${g.id}-${i}`}
                className={`group frame shrink-0 !p-2.5 ${i % 5 === 0 ? 'w-[26rem]' : 'w-72'}`}
              >
                <div className={`relative overflow-hidden rounded-[12px] ${i % 5 === 0 ? 'h-64 md:h-72' : 'h-64 md:h-72'}`}>
                  <img
                    src={g.imageUrl}
                    alt={g.caption ?? 'Gallery'}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                  />
                  {g.caption && (
                    <div
                      className="absolute inset-x-3 bottom-3 translate-y-3 rounded-xl border border-[#BEC0C6] px-4 py-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                      style={{ backgroundImage: 'linear-gradient(180deg,rgba(255, 255, 255,.96),rgba(229, 231, 237,.96))', boxShadow: '0 4px 10px rgba(31, 31, 37,.3)' }}
                    >
                      <p className="text-[12px] font-[650] text-[#333339]">{g.caption}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
