import Link from 'next/link';
import { db } from '@/db';
import { books, bookVariants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Reveal } from '@/components/motion';
import { tk } from '@/lib/utils';
import { ArrowUpRight, BookOpen, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BooksPage() {
  const list = await db.select().from(books).where(eq(books.active, true)).orderBy(books.id);
  const withVariants = await Promise.all(
    list.map(async (b) => ({
      book: b,
      variants: (await db.select().from(bookVariants).where(eq(bookVariants.bookId, b.id))).sort((x, y) => x.sortOrder - y.sortOrder),
    })),
  );

  return (
    <div className="hero-glow min-h-screen pt-36 md:pt-44">
      <div className="mx-auto max-w-7xl px-6 pb-28">
        <Reveal><p className="text-[12px] font-[750] uppercase tracking-[0.22em] text-[#E51A24]">Book Store</p></Reveal>
        <Reveal delay={0.08}>
          <h1 className="mt-5 max-w-3xl text-[clamp(2.4rem,5.4vw,4.2rem)] font-[800] leading-[1.02] tracking-[-0.035em] text-[#1A1A1A]">
            Course books,
            <span className="font-serif-accent font-normal italic tracking-normal text-[#E51A24]"> beautifully made.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[#6C757D]">
            Every LHBD book comes in multiple editions — full colour, black &amp; white, or a downloadable
            e-book. Preview real pages before you order.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {withVariants.map(({ book, variants }, i) => {
            const prices = variants.map((v) => v.offerPrice ?? v.price).filter((n) => n > 0);
            const from = prices.length ? Math.min(...prices) : 0;
            return (
              <Reveal key={book.id} delay={0.05 * i}>
                <Link href={`/books/${book.slug}`} className="group block h-full">
                  <article className="card-hover relative flex h-full flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_10px_36px_rgba(26,26,26,0.08)] ring-1 ring-black/[0.05]">
                    <div className="relative flex h-60 items-center justify-center overflow-hidden bg-gradient-to-br from-[#F1F3F5] to-[#E9ECEF] p-6">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage} alt={book.title}
                          className="h-full w-auto rounded-lg object-contain shadow-[0_18px_40px_rgba(26,26,26,0.25)] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <BookOpen size={44} className="text-[#ADB5BD]" />
                      )}
                      {variants.length > 0 && (
                        <span className="glass absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-[700] text-[#1A1A1A]">
                          <Layers size={12} className="text-[#E51A24]" /> {variants.length} editions
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-[17px] font-[700] tracking-tight text-[#1A1A1A] transition-colors group-hover:text-[#E51A24]">{book.title}</h3>
                      <p className="mt-1 line-clamp-2 text-[13px] text-[#6C757D]">{book.subtitle}</p>
                      <div className="mt-5 flex items-end justify-between border-t border-dashed border-black/10 pt-4">
                        <div>
                          <p className="text-[11px] font-[650] text-[#ADB5BD]">From</p>
                          <p className="text-[19px] font-[800] tracking-tight text-[#1A1A1A]">{tk(from)}</p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A1A] text-white transition-all duration-500 group-hover:bg-[#E51A24]">
                          <ArrowUpRight size={16} className="transition-transform duration-500 group-hover:rotate-45" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </Reveal>
            );
          })}
        </div>
        {!withVariants.length && <p className="mt-20 text-center text-[#6C757D]">Books will appear here soon.</p>}
      </div>
    </div>
  );
}
