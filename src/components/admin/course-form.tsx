'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upsertCourse } from '@/lib/actions/admin';
import { compressImage } from '@/lib/compress-image';
import { ImagePlus, Loader2, Save } from 'lucide-react';

type Teacher = { id: number; name: string };
type Initial = {
  id: number; slug: string; title: string; subtitle: string | null; description: string | null;
  level: string | null; ageRange: string | null; teacherId: number | null; durationWeeks: number | null;
  totalClasses: number; fee: number; offerFee: number | null; bookFee: number; banner: string | null;
  outcomes: string[] | null; active: boolean;
} | null;

export default function CourseForm({ initial, teachers }: { initial: Initial; teachers: Teacher[] }) {
  const [state, formAction, pending] = useActionState(upsertCourse, null as { ok: boolean; error?: string } | null);
  const [preview, setPreview] = useState<string | null>(initial?.banner ?? null);
  const [compressing, setCompressing] = useState(false);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = pending || compressing;

  useEffect(() => {
    if (state?.ok) router.push('/admin/courses');
  }, [state, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];
    if (file && file.size > 0) {
      setCompressing(true);
      try {
        fd.set('banner', await compressImage(file, 1600, 0.82));
      } finally {
        setCompressing(false);
      }
    }
    formAction(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-[30px] p-7 md:p-9">
      <input type="hidden" name="id" value={initial?.id ?? ''} />
      <p className="text-[17px] font-[800] tracking-tight">{initial ? 'Edit course' : 'Create course'}</p>

      {/* Banner */}
      <div className="mt-6">
        <label className="label">Course banner (upload from computer)</label>
        <button
          type="button" onClick={() => fileRef.current?.click()}
          className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-black/10 bg-[#F8F9FA] text-[#ADB5BD] transition hover:border-[#E51A24]"
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex items-center gap-2 text-[13px] font-[650]"><ImagePlus size={18} /> Choose banner image</span>
          )}
        </button>
        <input
          ref={fileRef} name="banner" type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Course title *</label>
          <input name="title" required defaultValue={initial?.title ?? ''} className="input" />
        </div>
        <div>
          <label className="label">Slug (URL)</label>
          <input name="slug" defaultValue={initial?.slug ?? ''} className="input" placeholder="auto-generated" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Subtitle</label>
          <input name="subtitle" defaultValue={initial?.subtitle ?? ''} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" rows={4} defaultValue={initial?.description ?? ''} className="input resize-none" />
        </div>
        <div>
          <label className="label">Ability / level</label>
          <input name="level" defaultValue={initial?.level ?? ''} className="input" placeholder="e.g. Beginner to Advanced" />
        </div>
        <div>
          <label className="label">Recommended age</label>
          <input name="ageRange" defaultValue={initial?.ageRange ?? ''} className="input" placeholder="e.g. 12+" />
        </div>
        <div>
          <label className="label">Mentor</label>
          <select name="teacherId" defaultValue={initial?.teacherId ?? ''} className="input">
            <option value="">None</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Duration (weeks)</label>
          <input name="durationWeeks" type="number" defaultValue={initial?.durationWeeks ?? ''} className="input" />
        </div>
        <div>
          <label className="label">Total classes</label>
          <input name="totalClasses" type="number" defaultValue={initial?.totalClasses ?? 22} className="input" />
        </div>
        <div>
          <label className="label">Course fee (৳)</label>
          <input name="fee" type="number" defaultValue={initial?.fee ?? ''} className="input" required />
        </div>
        <div>
          <label className="label">Offer price (৳, optional)</label>
          <input name="offerFee" type="number" defaultValue={initial?.offerFee ?? ''} className="input" placeholder="Leave empty for no offer" />
        </div>
        <div>
          <label className="label">Book fee (৳)</label>
          <input name="bookFee" type="number" defaultValue={initial?.bookFee ?? 300} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">What will be taught (one point per line)</label>
          <textarea name="outcomes" rows={5} defaultValue={initial?.outcomes?.join('\n') ?? ''} className="input resize-none" />
        </div>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} className="h-4 w-4 accent-[#E51A24]" />
          <span className="text-[13px] font-[650]">Visible on website</span>
        </label>
      </div>

      {state?.error && <p className="mt-4 text-[13px] font-[650] text-[#E51A24]">{state.error}</p>}

      <button disabled={busy} className="btn btn-primary btn-md mt-7 gap-2 disabled:opacity-70">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {compressing ? 'Optimizing image…' : pending ? 'Saving…' : initial ? 'Save changes' : 'Create course'}
      </button>
    </form>
  );
}
