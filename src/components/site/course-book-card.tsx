'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Check, FileText, Layers } from 'lucide-react';
import { tk } from '@/lib/utils';

export type BookOption = {
  id: number; slug: string; title: string; subtitle: string | null;
  coverImage: string | null; hasPdf: boolean;
  variants: { id: number; name: string; kind: string; price: number; offerPrice: number | null; inStock: boolean }[];
};

/**
 * Shown on the course page: the course's book, with yes/no selection and
 * variant picker. Selection is carried into the enrollment form via the URL.
 */
export default function CourseBookCard({
  book, courseSlug, include, variantId, onToggle, onVariant,
}: {
  book: BookOption; courseSlug: string;
  include: boolean; variantId: number | null;
  onToggle: (v: boolean) => void; onVariant: (id: number) => void;
}) {
  const selected = book.variants.find((v) => v.id === variantId) ?? null;
  const price = selected ? selected.offerPrice ?? selected.price : 0;

  return (
    <div className="overflow-hidden rounded-[30px] bg-white shadow-[0_12px_44px_rgba(26,26,26,0.07)] ring-1 ring-black/[0.05]">
      <div className="flex flex-wrap items-start gap-6 p-7">
        <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F1F3F5] shadow-[0_12px_28px_rgba(26,26,26,0.18)]">
          {book.coverImage
            ? <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
            : <span className="flex h-full items-center justify-center text-[#ADB5BD]"><BookOpen size={22} /></span>}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-[11px] font-[750] uppercase tracking-[0.16em] text-[#ADB5BD]">Course book</p>
            {book.hasPdf && (
              <Link href={`/books/${book.slug}`} className="inline-flex items-center gap-1 rounded-full bg-[#F1F3F5] px-2.5 py-1 text-[10.5px] font-[700] text-[#495057] transition hover:bg-[#E51A24] hover:text-white">
                <FileText size={11} /> Read some pages
              </Link>
            )}
          </div>
          <h3 className="mt-1.5 text-[19px] font-[800] tracking-tight text-[#1A1A1A]">{book.title}</h3>
          {book.subtitle && <p className="mt-1 text-[13px] leading-relaxed text-[#6C757D]">{book.subtitle}</p>}

          {/* Yes / No */}
          <div className="mt-4 inline-flex rounded-2xl bg-[#F1F3F5] p-1">
            {[
              { v: true, label: 'Add the book' },
              { v: false, label: 'No thanks' },
            ].map((o) => (
              <button
                key={String(o.v)}
                onClick={() => onToggle(o.v)}
                className={`rounded-xl px-4 py-2 text-[12.5px] font-[750] transition-all duration-400 ${
                  include === o.v ? 'bg-[#1A1A1A] text-white shadow-[0_8px_18px_rgba(26,26,26,0.2)]' : 'text-[#6C757D] hover:text-[#1A1A1A]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Variants */}
      <motion.div
        initial={false}
        animate={{ height: include ? 'auto' : 0, opacity: include ? 1 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="border-t border-black/[0.06] bg-[#F8F9FA] p-6">
          <p className="flex items-center gap-2 text-[11px] font-[750] uppercase tracking-[0.16em] text-[#ADB5BD]">
            <Layers size={13} /> Choose edition
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {book.variants.map((v) => {
              const active = v.id === variantId;
              const p = v.offerPrice ?? v.price;
              return (
                <button
                  key={v.id}
                  disabled={!v.inStock}
                  onClick={() => onVariant(v.id)}
                  className={`rounded-2xl px-4 py-3.5 text-left ring-1 transition-all duration-400 disabled:opacity-45 ${
                    active
                      ? 'bg-[#1A1A1A] text-white ring-[#1A1A1A] shadow-[0_12px_26px_rgba(26,26,26,0.2)]'
                      : 'bg-white ring-black/[0.07] hover:-translate-y-0.5 hover:ring-black/25'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-[12.5px] font-[750]">{v.name}</span>
                    {active && <Check size={13} className="text-[#E51A24]" />}
                  </span>
                  <span className={`mt-1 block text-[15px] font-[800] ${active ? 'text-[#E51A24]' : 'text-[#1A1A1A]'}`}>{tk(p)}</span>
                  <span className={`block text-[10px] font-[600] ${active ? 'text-white/45' : 'text-[#ADB5BD]'}`}>
                    {v.kind === 'ebook' ? 'Digital PDF' : 'Printed copy'}{!v.inStock ? ' · out of stock' : ''}
                  </span>
                </button>
              );
            })}
          </div>
          {selected && (
            <p className="mt-3 text-[12px] font-[650] text-[#6C757D]">
              Selected: <span className="text-[#1A1A1A]">{selected.name}</span> — {tk(price)} will be added to your total.
            </p>
          )}
        </div>
      </motion.div>
      <input type="hidden" value={courseSlug} readOnly />
    </div>
  );
}
