import { db } from '@/db';
import { galleryItems } from '@/db/schema';
import { desc } from 'drizzle-orm';
import GalleryGrid from '@/components/site/gallery-grid';
import { Reveal } from '@/components/motion';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const items = await db.select().from(galleryItems).orderBy(desc(galleryItems.id));
  return (
    <div className="hero-glow min-h-screen pt-32 md:pt-40">
      <div className="mx-auto max-w-7xl px-6 pb-28">
        <Reveal><p className="text-[12px] font-[750] uppercase tracking-[0.22em] text-[#E51A24]">Gallery</p></Reveal>
        <Reveal delay={0.08}>
          <h1 className="mt-5 max-w-3xl text-[clamp(2.4rem,5.4vw,4.2rem)] font-[800] leading-[1.02] tracking-[-0.035em] text-[#1A1A1A]">
            Life at
            <span className="font-serif-accent font-normal italic tracking-normal text-[#E51A24]"> Language Help BD.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[#6C757D]">
            Classes, conversations, certificates and everything in between — a continuous stream of campus moments.
          </p>
        </Reveal>
        <div className="mt-14">
          <GalleryGrid items={items} />
        </div>
      </div>
    </div>
  );
}
