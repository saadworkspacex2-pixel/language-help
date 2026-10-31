'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CreditCard, Sparkles } from 'lucide-react';
import { tk } from '@/lib/utils';
import CourseBookCard, { type BookOption } from '@/components/site/course-book-card';

type CourseLite = {
  slug: string; fee: number; offerFee: number | null; bookFee: number; totalClasses: number;
};

/**
 * Owns the shared book-selection state so the sticky price panel and the
 * in-page book card stay in sync, and the enrollment link carries the choice.
 */
export default function CoursePurchase({
  course, book, children,
}: { course: CourseLite; book: BookOption | null; children: React.ReactNode }) {
  const defaultVariant = book?.variants.find((v) => v.inStock) ?? book?.variants[0] ?? null;
  const [include, setInclude] = useState(true);
  const [variantId, setVariantId] = useState<number | null>(defaultVariant?.id ?? null);

  const eff = course.offerFee ?? course.fee;
  const hasOffer = course.offerFee !== null && course.offerFee < course.fee;
  const variant = book?.variants.find((v) => v.id === variantId) ?? null;

  // Book price: chosen variant if a book exists, otherwise the course's flat book fee
  const bookPrice = include ? (book ? (variant ? variant.offerPrice ?? variant.price : 0) : course.bookFee) : 0;
  const total = eff + bookPrice;

  const params = new URLSearchParams();
  params.set('book', include ? '1' : '0');
  if (include && variantId) params.set('variant', String(variantId));
  const enrollHref = `/enroll/${course.slug}?${params.toString()}`;

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1fr_380px]">
      <div className="space-y-12">
        {children}

        {book && (
          <div>
            <h2 className="text-[24px] font-[800] tracking-tight text-[#1A1A1A]">Course book</h2>
            <p className="mt-2 text-[13.5px] text-[#6C757D]">
              Choose whether to include the book with your enrollment, and pick the edition you prefer.
            </p>
            <div className="mt-5">
              <CourseBookCard
                book={book} courseSlug={course.slug}
                include={include} variantId={variantId}
                onToggle={setInclude} onVariant={setVariantId}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky price panel */}
      <div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong overflow-hidden rounded-[32px] lg:sticky lg:top-28"
        >
          <div className="bg-[#1A1A1A] p-7 text-white">
            <p className="text-[11px] font-[700] uppercase tracking-[0.18em] text-white/50">Total payable</p>
            <div className="mt-2 flex items-baseline gap-3">
              <motion.p key={total} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="text-[34px] font-[800] tracking-tight">
                {tk(total)}
              </motion.p>
              {hasOffer && <p className="text-[15px] font-[600] text-white/40 line-through">{tk(course.fee + bookPrice)}</p>}
            </div>
            {hasOffer && <span className="mt-2 inline-block rounded-full bg-[#E51A24] px-3 py-1 text-[11px] font-[700]">Offer price applied</span>}
          </div>

          <div className="p-7">
            <div className="space-y-3 text-[13.5px] font-[600]">
              <div className="flex justify-between"><span className="text-[#6C757D]">Course fee</span><span>{tk(eff)}</span></div>
              <div className="flex justify-between">
                <span className="text-[#6C757D]">
                  {book ? (include ? `Book — ${variant?.name ?? 'edition'}` : 'Book (not included)') : 'Course book'}
                </span>
                <motion.span key={bookPrice} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {include ? tk(bookPrice) : '—'}
                </motion.span>
              </div>
              <div className="flex justify-between border-t border-dashed border-black/10 pt-3 text-[15px] font-[800]">
                <span>Total</span><span className="text-[#E51A24]">{tk(total)}</span>
              </div>
            </div>

            <Link href={enrollHref} className="btn btn-primary btn-lg mt-6 w-full gap-2">
              Request Enrollment <ArrowRight size={16} />
            </Link>

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-2.5 rounded-2xl bg-[#F8F9FA] p-3.5 text-[12px] leading-relaxed text-[#6C757D]">
                <BookOpen size={14} className="mt-0.5 shrink-0 text-[#E51A24]" />
                Payment is made at the office — full or in installments.
              </div>
              <div className="flex items-start gap-2.5 rounded-2xl bg-[#F8F9FA] p-3.5 text-[12px] leading-relaxed text-[#6C757D]">
                <CreditCard size={14} className="mt-0.5 shrink-0 text-[#ADB5BD]" />
                Online payment is not available right now — coming soon.
              </div>
              <div className="flex items-start gap-2.5 rounded-2xl bg-[#F8F9FA] p-3.5 text-[12px] leading-relaxed text-[#6C757D]">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-[#E51A24]" />
                Certificate of Completion after class {course.totalClasses}.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
