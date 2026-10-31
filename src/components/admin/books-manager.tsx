'use client';

import { useActionState, useRef, useState } from 'react';
import { deleteBook, deleteVariant, saveVariant, setBookOrderStatus, upsertBook } from '@/lib/actions/books';
import { compressImage } from '@/lib/compress-image';
import { formatDate, tk } from '@/lib/utils';
import {
  BookOpen, ChevronDown, FileText, ImagePlus, Loader2, Plus, Save, ShoppingBag, Trash2,
} from 'lucide-react';

type Variant = { id: number; name: string; kind: string; price: number; offerPrice: number | null; inStock: boolean; sortOrder: number };
type BookLite = {
  id: number; slug: string; title: string; subtitle: string | null; description: string | null;
  author: string | null; coverImage: string | null; previewPdf: string | null; previewImages: string[];
  pages: number | null; language: string | null; courseId: number | null; active: boolean;
};
type Order = {
  id: number; fullName: string; phone: string; email: string | null; address: string | null;
  quantity: number; amount: number; status: string; createdAt: Date; bookTitle: string; variantName: string;
};

function BookForm({ book, courses, onClose }: { book: BookLite | null; courses: { id: number; title: string }[]; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(upsertBook, null as { ok: boolean; error?: string } | null);
  const [cover, setCover] = useState<string | null>(book?.coverImage ?? null);
  const [compressing, setCompressing] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);
  const busy = pending || compressing;

  if (state?.ok) { onClose(); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setCompressing(true);
    try {
      const c = coverRef.current?.files?.[0];
      if (c) fd.set('cover', await compressImage(c, 1200, 0.85)); else fd.delete('cover');
      const pdf = pdfRef.current?.files?.[0];
      if (!pdf) fd.delete('pdf');
      fd.delete('previews');
      for (const f of Array.from(previewRef.current?.files ?? [])) {
        fd.append('previews', await compressImage(f, 1400, 0.85));
      }
    } finally { setCompressing(false); }
    formAction(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-black/[0.06] p-6">
      <input type="hidden" name="id" value={book?.id ?? ''} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Book cover</label>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => coverRef.current?.click()}
              className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-black/10 bg-[#F8F9FA] text-[#ADB5BD] hover:border-[#E51A24]">
              {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={18} />}
            </button>
            <p className="text-[11.5px] text-[#6C757D]">Upload from computer. A portrait cover looks best.</p>
          </div>
          <input ref={coverRef} name="cover" type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setCover(URL.createObjectURL(f)); }} />
        </div>
        <div><label className="label">Title *</label><input name="title" required defaultValue={book?.title ?? ''} className="input" /></div>
        <div><label className="label">Slug</label><input name="slug" defaultValue={book?.slug ?? ''} className="input" placeholder="auto" /></div>
        <div className="sm:col-span-2"><label className="label">Subtitle</label><input name="subtitle" defaultValue={book?.subtitle ?? ''} className="input" /></div>
        <div className="sm:col-span-2"><label className="label">Description</label><textarea name="description" rows={4} defaultValue={book?.description ?? ''} className="input resize-none" /></div>
        <div><label className="label">Author</label><input name="author" defaultValue={book?.author ?? ''} className="input" /></div>
        <div><label className="label">Pages</label><input name="pages" type="number" defaultValue={book?.pages ?? ''} className="input" /></div>
        <div><label className="label">Language</label><input name="language" defaultValue={book?.language ?? ''} className="input" placeholder="English / Bangla" /></div>
        <div>
          <label className="label">Linked course</label>
          <select name="courseId" defaultValue={book?.courseId ?? ''} className="input">
            <option value="">None</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Preview PDF (shown as book preview)</label>
          <input ref={pdfRef} name="pdf" type="file" accept="application/pdf" className="input !py-2 text-xs" />
          {book?.previewPdf && <p className="mt-1 flex items-center gap-1 text-[11px] font-[650] text-emerald-600"><FileText size={11} /> PDF uploaded</p>}
        </div>
        <div>
          <label className="label">Preview page images (multiple)</label>
          <input ref={previewRef} name="previews" type="file" accept="image/*" multiple className="input !py-2 text-xs" />
          {!!book?.previewImages.length && <p className="mt-1 text-[11px] font-[650] text-emerald-600">{book.previewImages.length} pages uploaded</p>}
        </div>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" name="active" defaultChecked={book?.active ?? true} className="h-4 w-4 accent-[#E51A24]" />
          <span className="text-[13px] font-[650]">Visible in the store</span>
        </label>
      </div>
      {state?.error && <p className="mt-3 text-[12.5px] font-[650] text-[#E51A24]">{state.error}</p>}
      <button disabled={busy} className="btn btn-primary btn-md mt-5 gap-2 disabled:opacity-70">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {compressing ? 'Optimizing…' : book ? 'Save book' : 'Create book'}
      </button>
    </form>
  );
}

function VariantRows({ bookId, variants }: { bookId: number; variants: Variant[] }) {
  return (
    <div className="border-t border-black/[0.06] bg-[#F8F9FA] p-6">
      <p className="text-[13px] font-[800] tracking-tight">Editions & pricing</p>
      <div className="mt-3 space-y-2">
        {variants.map((v) => (
          <form key={v.id} action={saveVariant} className="flex flex-wrap items-end gap-2 rounded-2xl bg-white p-3 ring-1 ring-black/[0.05]">
            <input type="hidden" name="id" value={v.id} />
            <input type="hidden" name="bookId" value={bookId} />
            <div className="min-w-32 flex-1"><label className="label">Edition</label><input name="name" defaultValue={v.name} className="input !py-2 text-xs" /></div>
            <div><label className="label">Kind</label>
              <select name="kind" defaultValue={v.kind} className="input !w-24 !py-2 text-xs"><option value="print">Print</option><option value="ebook">E-book</option></select>
            </div>
            <div><label className="label">Price</label><input name="price" type="number" defaultValue={v.price} className="input !w-24 !py-2 text-xs" /></div>
            <div><label className="label">Offer</label><input name="offerPrice" type="number" defaultValue={v.offerPrice ?? ''} className="input !w-24 !py-2 text-xs" /></div>
            <div><label className="label">Order</label><input name="sortOrder" type="number" defaultValue={v.sortOrder} className="input !w-16 !py-2 text-xs" /></div>
            <label className="flex items-center gap-1.5 pb-2"><input type="checkbox" name="inStock" defaultChecked={v.inStock} className="h-3.5 w-3.5 accent-[#E51A24]" /><span className="text-[11px] font-[650]">In stock</span></label>
            <button className="btn btn-dark btn-sm">Save</button>
            <button formAction={deleteVariant} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#ADB5BD] hover:bg-red-50 hover:text-[#E51A24]"><Trash2 size={13} /></button>
          </form>
        ))}
      </div>
      <form action={saveVariant} className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border-2 border-dashed border-black/10 p-3">
        <input type="hidden" name="bookId" value={bookId} />
        <div className="min-w-32 flex-1"><label className="label">New edition</label><input name="name" required className="input !py-2 text-xs" placeholder="e.g. Hardcover" /></div>
        <div><label className="label">Kind</label><select name="kind" className="input !w-24 !py-2 text-xs"><option value="print">Print</option><option value="ebook">E-book</option></select></div>
        <div><label className="label">Price</label><input name="price" type="number" required className="input !w-24 !py-2 text-xs" /></div>
        <label className="flex items-center gap-1.5 pb-2"><input type="checkbox" name="inStock" defaultChecked className="h-3.5 w-3.5 accent-[#E51A24]" /><span className="text-[11px] font-[650]">In stock</span></label>
        <button className="btn btn-primary btn-sm gap-1"><Plus size={12} /> Add</button>
      </form>
    </div>
  );
}

export default function BooksManager({
  items, courses, orders,
}: { items: { book: BookLite; variants: Variant[] }[]; courses: { id: number; title: string }[]; orders: Order[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button onClick={() => setCreating((v) => !v)} className="btn btn-primary btn-md gap-2"><Plus size={15} /> New book</button>
      </div>

      {creating && (
        <div className="glass overflow-hidden rounded-[26px]">
          <p className="px-6 pt-6 text-[16px] font-[800] tracking-tight">Create a book</p>
          <BookForm book={null} courses={courses} onClose={() => setCreating(false)} />
        </div>
      )}

      <div className="space-y-4">
        {items.map(({ book, variants }) => (
          <details key={book.id} className="group glass overflow-hidden rounded-[26px]">
            <summary className="flex cursor-pointer list-none items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
              {book.coverImage
                ? <img src={book.coverImage} alt="" className="h-16 w-12 rounded-lg object-cover shadow" />
                : <span className="flex h-16 w-12 items-center justify-center rounded-lg bg-[#F1F3F5] text-[#ADB5BD]"><BookOpen size={16} /></span>}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14.5px] font-[800] tracking-tight">{book.title}</p>
                  {!book.active && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-[750] text-gray-500">hidden</span>}
                </div>
                <p className="text-[11.5px] font-[600] text-[#ADB5BD]">
                  {variants.length} editions · from {tk(Math.min(...variants.map((v) => v.offerPrice ?? v.price), 0) || 0)}
                  {book.previewPdf ? ' · PDF preview' : ''}{book.previewImages.length ? ` · ${book.previewImages.length} preview pages` : ''}
                </p>
              </div>
              <ChevronDown size={16} className="text-[#ADB5BD] transition-transform group-open:rotate-180" />
            </summary>
            <BookForm book={book} courses={courses} onClose={() => {}} />
            <VariantRows bookId={book.id} variants={variants} />
            <form action={deleteBook} className="border-t border-black/[0.06] px-6 py-3">
              <input type="hidden" name="id" value={book.id} />
              <button className="flex items-center gap-1.5 text-[11.5px] font-[700] text-[#ADB5BD] hover:text-[#E51A24]"><Trash2 size={12} /> Delete book</button>
            </form>
          </details>
        ))}
        {!items.length && <p className="glass rounded-[26px] p-10 text-center text-[13px] text-[#ADB5BD]">No books yet — create your first one.</p>}
      </div>

      {/* Orders */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-[17px] font-[800] tracking-tight"><ShoppingBag size={16} className="text-[#E51A24]" /> Book orders</h2>
        <div className="space-y-2.5">
          {orders.map((o) => (
            <div key={o.id} className="glass flex flex-wrap items-center justify-between gap-4 rounded-[22px] p-5">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-[800] tracking-tight">{o.fullName} <span className="ml-1 text-[11px] font-[650] text-[#ADB5BD]">{o.phone}</span></p>
                <p className="text-[11.5px] font-[600] text-[#6C757D]">
                  {o.bookTitle} · {o.variantName} × {o.quantity} · <span className="font-[800] text-[#E51A24]">{tk(o.amount)}</span> · {formatDate(o.createdAt)}
                </p>
                {o.address && <p className="mt-0.5 text-[11px] text-[#ADB5BD]">{o.address}</p>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['new', 'confirmed', 'delivered', 'cancelled'] as const).map((s) => (
                  <form key={s} action={setBookOrderStatus}>
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="status" value={s} />
                    <button className={`btn btn-sm capitalize ${o.status === s ? 'btn-dark' : 'btn-outline'}`}>{s}</button>
                  </form>
                ))}
              </div>
            </div>
          ))}
          {!orders.length && <p className="glass rounded-[22px] p-8 text-center text-[13px] text-[#ADB5BD]">No book orders yet.</p>}
        </div>
      </div>
    </div>
  );
}
