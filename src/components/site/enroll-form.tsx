'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitEnrollmentRequest } from '@/lib/actions/public';
import PhotoCropper from '@/components/photo-crop';
import { tk } from '@/lib/utils';
import { BookOpen, CheckCircle2, Loader2, Send } from 'lucide-react';
import CourseBookCard, { type BookOption } from '@/components/site/course-book-card';

type Props = {
  course: { id: number; title: string; fee: number; bookFee: number; totalClasses: number };
  book?: BookOption | null;
  initialInclude?: boolean;
  initialVariantId?: number | null;
};

export default function EnrollForm({ course, book = null, initialInclude = true, initialVariantId = null }: Props) {
  const fallbackVariant = book?.variants.find((v) => v.inStock) ?? book?.variants[0] ?? null;
  const [include, setInclude] = useState(initialInclude);
  const [variantId, setVariantId] = useState<number | null>(initialVariantId ?? fallbackVariant?.id ?? null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('courseId', String(course.id));
    fd.set('includeBook', include ? '1' : '0');
    if (include && variantId) fd.set('bookVariantId', String(variantId));
    if (photo) fd.set('photo', photo);
    const res = await submitEnrollmentRequest(fd);
    if (res.ok) setState('done');
    else {
      setState('idle');
      setError(res.error ?? 'Something went wrong.');
    }
  }

  const selectedVariant = book?.variants.find((v) => v.id === variantId) ?? null;
  const bookPrice = include ? (book ? (selectedVariant ? selectedVariant.offerPrice ?? selectedVariant.price : 0) : course.bookFee) : 0;
  const total = course.fee + bookPrice;

  if (state === 'done') {
    return (
      <div className="glass-strong rounded-[32px] p-10 text-center md:p-14">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={36} />
        </span>
        <h2 className="mt-6 text-[24px] font-[800] tracking-tight text-[#1A1A1A]">Enrollment request received</h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-[#6C757D]">
          Thank you! Language Help BD management will contact you shortly on your mobile or
          WhatsApp to confirm your batch and next steps.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/courses" className="btn btn-outline btn-md">Browse courses</Link>
          <Link href="/register" className="btn btn-primary btn-md">Create student account</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handle} className="glass-strong rounded-[32px] p-7 md:p-10">
      <div className="mb-7 rounded-3xl bg-[#1A1A1A] px-6 py-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-[700] uppercase tracking-[0.16em] text-white/50">Enrolling in</p>
            <p className="text-[17px] font-[800] tracking-tight">{course.title}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-[700] uppercase tracking-[0.16em] text-white/50">Total due</p>
            <p className="text-[24px] font-[800] tracking-tight text-[#E51A24]">{tk(total)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-white/10 pt-3.5 text-[12px] font-[600] text-white/60">
          <span>Course fee: <span className="text-white">{tk(course.fee)}</span></span>
          <span className="flex items-center gap-1.5">
            <BookOpen size={12} className="text-[#E51A24]" />
            {include ? <>Book{selectedVariant ? ` (${selectedVariant.name})` : ''}: <span className="text-white">{tk(bookPrice)}</span></> : 'Book not included'}
          </span>
        </div>
      </div>

      {book && (
        <div className="mb-7">
          <CourseBookCard
            book={book} courseSlug=""
            include={include} variantId={variantId}
            onToggle={setInclude} onVariant={setVariantId}
          />
        </div>
      )}

      <PhotoCropper onFile={setPhoto} label="Profile Picture (crop before submitting)" />

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Full Name *</label>
          <input name="fullName" required className="input" placeholder="Your full name" />
        </div>
        <div>
          <label className="label">Class</label>
          <input name="className" className="input" placeholder="e.g. Class 10 / HSC / Graduate" />
        </div>
        <div>
          <label className="label">Mobile Phone *</label>
          <input name="mobile" required className="input" placeholder="01XXXXXXXXX" />
        </div>
        <div>
          <label className="label">WhatsApp Number</label>
          <input name="whatsapp" className="input" placeholder="01XXXXXXXXX" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Email Address</label>
          <input name="email" type="email" className="input" placeholder="you@email.com" />
        </div>
        <div>
          <label className="label">Father&apos;s Name</label>
          <input name="fatherName" className="input" />
        </div>
        <div>
          <label className="label">Mother&apos;s Name</label>
          <input name="motherName" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Home Address</label>
          <textarea name="address" rows={2} className="input resize-none" placeholder="Village / Road / City / District" />
        </div>
      </div>

      {error && <p className="mt-4 text-[13px] font-[600] text-[#E51A24]">{error}</p>}

      <button disabled={state === 'loading'} className="btn btn-primary btn-lg mt-8 w-full gap-2 disabled:opacity-70">
        {state === 'loading' ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
        Submit Enrollment Request
      </button>
      <p className="mt-4 text-center text-[12px] leading-relaxed text-[#ADB5BD]">
        This is an enrollment request, not a payment. Management will confirm your admission and
        payment is completed at the office.
      </p>
    </form>
  );
}
