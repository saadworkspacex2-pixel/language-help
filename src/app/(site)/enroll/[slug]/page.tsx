import { notFound } from 'next/navigation';
import { db } from '@/db';
import { courses, books, bookVariants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import EnrollForm from '@/components/site/enroll-form';
import { effectiveFee, tk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EnrollPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ book?: string; variant?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const course = (await db.select().from(courses).where(eq(courses.slug, slug)).limit(1))[0];
  if (!course) notFound();

  const eff = effectiveFee(course);
  const bookRow = (await db.select().from(books).where(eq(books.courseId, course.id)).limit(1))[0] ?? null;
  const bookOption = bookRow
    ? {
        id: bookRow.id, slug: bookRow.slug, title: bookRow.title, subtitle: bookRow.subtitle,
        coverImage: bookRow.coverImage, hasPdf: !!bookRow.previewPdf,
        variants: (await db.select().from(bookVariants).where(eq(bookVariants.bookId, bookRow.id)))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((v) => ({ id: v.id, name: v.name, kind: v.kind, price: v.price, offerPrice: v.offerPrice, inStock: v.inStock })),
      }
    : null;
  return (
    <div className="hero-glow min-h-screen pt-36 md:pt-40">
      <div className="mx-auto max-w-5xl px-6 pb-28">
        <div className="text-center">
          <p className="text-[12px] font-[750] uppercase tracking-[0.22em] text-[#E51A24]">Enrollment Request</p>
          <h1 className="mx-auto mt-4 max-w-2xl text-[clamp(2rem,4.6vw,3.4rem)] font-[800] leading-[1.04] tracking-[-0.03em] text-[#1A1A1A]">
            Reserve your seat in
            <span className="font-serif-accent font-normal italic tracking-normal text-[#E51A24]"> {course.title}.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[14.5px] leading-relaxed text-[#6C757D]">
            Fill in the form below — our management team will call you to confirm your batch.
            Course fee {tk(eff)} + book {tk(course.bookFee)}, payable at the office.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <EnrollForm
            course={{ id: course.id, title: course.title, fee: eff, bookFee: course.bookFee, totalClasses: course.totalClasses }}
            book={bookOption}
            initialInclude={sp.book !== '0'}
            initialVariantId={sp.variant ? Number(sp.variant) : null}
          />
        </div>
      </div>
    </div>
  );
}
