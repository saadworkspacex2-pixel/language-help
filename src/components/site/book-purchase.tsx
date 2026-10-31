'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { placeBookOrder } from '@/lib/actions/books';
import { tk } from '@/lib/utils';
import {
  ArrowLeft, BookOpen, CheckCircle2, FileText, Languages, Layers,
  Loader2, Minus, Plus, ShoppingBag, Sparkles, X, CreditCard, BookOpenCheck, Maximize2,
} from 'lucide-react';

type Variant = { id: number; name: string; kind: string; price: number; offerPrice: number | null; inStock: boolean };
type Book = {
  id: number; title: string; subtitle: string | null; description: string | null; author: string | null;
  coverImage: string | null; previewPdf: string | null; previewImages: string[]; pages: number | null; language: string | null;
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function BookPurchase({
  book, variants, course,
}: { book: Book; variants: Variant[]; course: { title: string; slug: string } | null }) {
  const firstAvailable = variants.find((v) => v.inStock) ?? variants[0] ?? null;
  const [variantId, setVariantId] = useState<number | null>(firstAvailable?.id ?? null);
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [reader, setReader] = useState(false);
  const [state, formAction, pending] = useActionState(placeBookOrder, null as { ok: boolean; error?: string; amount?: number } | null);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const unit = variant ? variant.offerPrice ?? variant.price : 0;
  const total = unit * qty;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-32 md:pt-36">
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <Link href="/books" className="inline-flex items-center gap-2 text-[13px] font-[650] text-[#6C757D] transition hover:text-[#1A1A1A]">
          <ArrowLeft size={15} /> All books
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_420px]">
          {/* Left: visual */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}
              className="relative flex items-center justify-center overflow-hidden rounded-[34px] bg-gradient-to-br from-[#1A1A1A] to-[#343A40] p-12 shadow-[0_30px_80px_rgba(26,26,26,0.25)]"
            >
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#E51A24] opacity-25 blur-[90px]" />
              {book.coverImage ? (
                <motion.img
                  src={book.coverImage} alt={book.title}
                  initial={{ rotateY: -12, scale: 0.94 }} animate={{ rotateY: 0, scale: 1 }}
                  transition={{ duration: 1.1, ease }}
                  className="relative max-h-[420px] w-auto rounded-xl shadow-[0_40px_70px_rgba(0,0,0,0.55)]"
                />
              ) : (
                <BookOpen size={80} className="text-white/30" />
              )}
            </motion.div>

            {/* Page previews */}
            {book.previewImages.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-[20px] font-[800] tracking-tight text-[#1A1A1A]">
                  <Sparkles size={18} className="text-[#E51A24]" /> Look inside
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {book.previewImages.map((src, i) => (
                    <motion.button
                      key={i} onClick={() => setPreview(src)}
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.06, ease }}
                      className="group overflow-hidden rounded-2xl bg-white p-2 shadow-[0_10px_30px_rgba(26,26,26,0.1)] ring-1 ring-black/[0.05]"
                    >
                      <img src={src} alt={`Page ${i + 1}`} className="aspect-[3/4] w-full rounded-xl object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Read some pages */}
            {book.previewPdf && (
              <button
                onClick={() => setReader(true)}
                className="card-hover group flex w-full items-center justify-between gap-5 rounded-[26px] bg-[#1A1A1A] p-7 text-left text-white"
              >
                <span className="flex items-center gap-5">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E51A24] shadow-[0_12px_28px_rgba(229,26,36,0.4)]">
                    <FileText size={22} />
                  </span>
                  <span>
                    <span className="block text-[18px] font-[800] tracking-tight">Read some Pages</span>
                    <span className="mt-0.5 block text-[12.5px] text-white/55">Open a free sample of this book in the reader</span>
                  </span>
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-all duration-500 group-hover:bg-[#E51A24]">
                  <BookOpenCheck size={18} />
                </span>
              </button>
            )}

            {book.description && (
              <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_40px_rgba(26,26,26,0.07)] ring-1 ring-black/[0.05]">
                <h2 className="text-[20px] font-[800] tracking-tight text-[#1A1A1A]">About this book</h2>
                <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.85] text-[#495057]">{book.description}</p>
              </div>
            )}
          </div>

          {/* Right: purchase panel */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1, ease }}
              className="glass-strong overflow-hidden rounded-[32px] lg:sticky lg:top-28"
            >
              <div className="p-7">
                <h1 className="text-[26px] font-[800] leading-tight tracking-[-0.02em] text-[#1A1A1A]">{book.title}</h1>
                {book.subtitle && <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6C757D]">{book.subtitle}</p>}

                <div className="mt-4 flex flex-wrap gap-2 text-[11.5px] font-[650] text-[#6C757D]">
                  {book.author && <span className="rounded-full bg-[#F1F3F5] px-3 py-1.5">By {book.author}</span>}
                  {book.pages && <span className="rounded-full bg-[#F1F3F5] px-3 py-1.5">{book.pages} pages</span>}
                  {book.language && <span className="flex items-center gap-1.5 rounded-full bg-[#F1F3F5] px-3 py-1.5"><Languages size={12} /> {book.language}</span>}
                </div>

                {/* Variations */}
                <p className="mt-6 flex items-center gap-2 text-[11px] font-[750] uppercase tracking-[0.16em] text-[#ADB5BD]">
                  <Layers size={13} /> Choose edition
                </p>
                <div className="mt-3 space-y-2.5">
                  {variants.map((v) => {
                    const active = v.id === variantId;
                    const p = v.offerPrice ?? v.price;
                    return (
                      <button
                        key={v.id}
                        onClick={() => v.inStock && setVariantId(v.id)}
                        disabled={!v.inStock}
                        className={`flex w-full items-center justify-between rounded-2xl px-5 py-3.5 text-left ring-1 transition-all duration-400 disabled:opacity-45 ${
                          active
                            ? 'bg-[#1A1A1A] text-white ring-[#1A1A1A] shadow-[0_12px_28px_rgba(26,26,26,0.22)]'
                            : 'bg-white/70 ring-black/[0.07] hover:-translate-y-0.5 hover:ring-black/25'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`flex h-4 w-4 items-center justify-center rounded-full ring-2 transition ${active ? 'bg-[#E51A24] ring-[#E51A24]' : 'ring-[#CED4DA]'}`}>
                            {active && <CheckCircle2 size={10} className="text-white" />}
                          </span>
                          <span>
                            <span className="block text-[13.5px] font-[750]">{v.name}</span>
                            <span className={`block text-[10.5px] font-[600] ${active ? 'text-white/50' : 'text-[#ADB5BD]'}`}>
                              {v.kind === 'ebook' ? 'Instant PDF download' : 'Printed copy'}{!v.inStock ? ' · out of stock' : ''}
                            </span>
                          </span>
                        </span>
                        <span className="text-right">
                          <span className={`block text-[15px] font-[800] ${active ? 'text-[#E51A24]' : 'text-[#1A1A1A]'}`}>{tk(p)}</span>
                          {v.offerPrice !== null && v.offerPrice < v.price && (
                            <span className={`block text-[10.5px] line-through ${active ? 'text-white/40' : 'text-[#ADB5BD]'}`}>{tk(v.price)}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                  {!variants.length && <p className="rounded-2xl bg-[#F8F9FA] p-4 text-center text-[12.5px] text-[#ADB5BD]">No editions available yet.</p>}
                </div>

                {/* Quantity */}
                {variant?.kind !== 'ebook' && (
                  <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#F8F9FA] px-5 py-3">
                    <span className="text-[12.5px] font-[700] text-[#495057]">Quantity</span>
                    <span className="flex items-center gap-3">
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#1A1A1A] ring-1 ring-black/[0.07] transition hover:ring-[#E51A24]"><Minus size={13} /></button>
                      <span className="w-6 text-center text-[14px] font-[800]">{qty}</span>
                      <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#1A1A1A] ring-1 ring-black/[0.07] transition hover:ring-[#E51A24]"><Plus size={13} /></button>
                    </span>
                  </div>
                )}

                <div className="mt-5 flex items-end justify-between border-t border-dashed border-black/10 pt-4">
                  <span className="text-[12.5px] font-[700] text-[#6C757D]">Total</span>
                  <span className="text-[26px] font-[800] tracking-tight text-[#E51A24]">{tk(total)}</span>
                </div>

                <button onClick={() => setOpen(true)} disabled={!variant} className="btn btn-primary btn-lg mt-5 w-full gap-2 disabled:opacity-50">
                  <ShoppingBag size={16} /> Order this book
                </button>

                <p className="mt-4 flex items-start gap-2 rounded-2xl bg-[#F8F9FA] p-3.5 text-[11.5px] leading-relaxed text-[#6C757D]">
                  <CreditCard size={13} className="mt-0.5 shrink-0 text-[#ADB5BD]" />
                  Online payment is not available right now — coming soon. Pay on collection at the office.
                </p>

                {course && (
                  <Link href={`/courses/${course.slug}`} className="mt-3 flex items-center justify-between rounded-2xl bg-[#F8F9FA] px-4 py-3 text-[12.5px] font-[700] text-[#1A1A1A] transition hover:bg-[#F1F3F5]">
                    Used in {course.title} <ArrowLeft size={13} className="rotate-180 text-[#E51A24]" />
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Page preview lightbox */}
      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-6 backdrop-blur-md">
            <motion.img
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              src={preview} alt="Preview" className="max-h-[85vh] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF reader overlay */}
      <AnimatePresence>
        {reader && book.previewPdf && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex flex-col bg-black/80 p-3 backdrop-blur-xl sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.96, y: 26 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 26 }}
              transition={{ duration: 0.45, ease }}
              className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-black/[0.07] px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E51A24] text-white"><FileText size={16} /></span>
                  <div>
                    <p className="text-[14px] font-[800] tracking-tight">{book.title}</p>
                    <p className="text-[11px] font-[600] text-[#ADB5BD]">Free sample pages</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={book.previewPdf} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm gap-1.5">
                    <Maximize2 size={13} /> New tab
                  </a>
                  <button onClick={() => setReader(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6C757D] transition hover:bg-black/5 hover:text-[#1A1A1A]">
                    <X size={17} />
                  </button>
                </div>
              </div>
              <iframe src={`${book.previewPdf}#view=FitH`} title="Book sample" className="w-full flex-1 border-0 bg-[#F8F9FA]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order modal */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.94, y: 28 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 28 }}
              transition={{ duration: 0.4, ease }}
              className="glass-strong my-10 w-full max-w-md rounded-[30px] p-7"
            >
              {state?.ok ? (
                <div className="py-6 text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={30} /></span>
                  <p className="mt-5 text-[19px] font-[800] tracking-tight">Order received</p>
                  <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-[#6C757D]">
                    Thank you! Management will contact you shortly to arrange payment and collection.
                  </p>
                  <button onClick={() => setOpen(false)} className="btn btn-dark btn-md mt-6 w-full">Done</button>
                </div>
              ) : (
                <form action={formAction}>
                  <div className="flex items-center justify-between">
                    <p className="text-[17px] font-[800] tracking-tight">Order book</p>
                    <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-black/5"><X size={17} /></button>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#1A1A1A] px-5 py-3.5 text-white">
                    <div>
                      <p className="text-[13px] font-[750]">{book.title}</p>
                      <p className="text-[11px] text-white/55">{variant?.name} × {qty}</p>
                    </div>
                    <p className="text-[18px] font-[800] text-[#E51A24]">{tk(total)}</p>
                  </div>

                  <input type="hidden" name="bookId" value={book.id} />
                  <input type="hidden" name="variantId" value={variantId ?? ''} />
                  <input type="hidden" name="quantity" value={qty} />

                  <div className="mt-5 space-y-3.5">
                    <div><label className="label">Full Name *</label><input name="fullName" required className="input" /></div>
                    <div><label className="label">Phone *</label><input name="phone" required className="input" placeholder="01XXXXXXXXX" /></div>
                    <div><label className="label">Email</label><input name="email" type="email" className="input" /></div>
                    <div><label className="label">Delivery address</label><textarea name="address" rows={2} className="input resize-none" placeholder="Or leave blank to collect from office" /></div>
                  </div>

                  {state?.error && <p className="mt-3 text-[12.5px] font-[650] text-[#E51A24]">{state.error}</p>}

                  <button disabled={pending} className="btn btn-primary btn-md mt-6 w-full gap-2 disabled:opacity-70">
                    {pending ? <Loader2 size={15} className="animate-spin" /> : <ShoppingBag size={15} />} Place order
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
