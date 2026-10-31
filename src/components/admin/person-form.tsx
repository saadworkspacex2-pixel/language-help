'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { upsertPerson } from '@/lib/actions/admin';
import { compressImage } from '@/lib/compress-image';
import { Loader2, Save, X } from 'lucide-react';

export type PersonLite = {
  id: number; name: string; email: string; role: string; phone: string | null;
  experience: string | null; bio: string | null; degrees: string | null;
  studyBackground: string | null; age: number | null; isFounder: boolean;
  profileImage: string | null; profileGallery: string[] | null;
} | null;

function Inner({ person, onDone }: { person: PersonLite; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(upsertPerson, null as { ok: boolean; error?: string } | null);
  const [preview, setPreview] = useState<string | null>(person?.profileImage ?? null);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = pending || compressing;

  useEffect(() => { if (state?.ok) onDone(); }, [state, onDone]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];
    if (file && file.size > 0) {
      setCompressing(true);
      try {
        fd.set('photo', await compressImage(file, 1200, 0.82));
      } finally {
        setCompressing(false);
      }
    }
    formAction(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
      <input type="hidden" name="id" value={person?.id ?? ''} />

      <div className="flex items-center gap-4">
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#F1F3F5] text-[11px] font-[650] text-[#ADB5BD] ring-1 ring-black/10">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : 'Photo'}
        </button>
        <input ref={fileRef} name="photo" type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Role</label>
            <select name="role" defaultValue={person?.role === 'management' ? 'management' : 'teacher'} className="input">
              <option value="teacher">Teacher / Mentor</option>
              <option value="management">Management</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 pt-6">
            <input type="checkbox" name="isFounder" defaultChecked={person?.isFounder ?? false} className="h-4 w-4 accent-[#E51A24]" />
            <span className="text-[12.5px] font-[650]">Founder (featured profile)</span>
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Name *</label><input name="name" required defaultValue={person?.name ?? ''} className="input" /></div>
        <div><label className="label">Email *</label><input name="email" type="email" required defaultValue={person?.email ?? ''} className="input" /></div>
        <div><label className="label">Phone</label><input name="phone" defaultValue={person?.phone ?? ''} className="input" /></div>
        <div>
          <label className="label">{person ? 'New password (leave blank to keep)' : 'Password *'}</label>
          <input name="password" type="text" className="input" placeholder={person ? '••••••••' : 'Login password'} />
        </div>
        <div><label className="label">Experience</label><input name="experience" defaultValue={person?.experience ?? ''} className="input" placeholder="e.g. 8+ years teaching IELTS" /></div>
        <div><label className="label">Age</label><input name="age" type="number" defaultValue={person?.age ?? ''} className="input" /></div>
        <div className="sm:col-span-2"><label className="label">Bio / description</label><textarea name="bio" rows={3} defaultValue={person?.bio ?? ''} className="input resize-none" /></div>
        <div className="sm:col-span-2"><label className="label">Degrees (one per line)</label><textarea name="degrees" rows={2} defaultValue={person?.degrees ?? ''} className="input resize-none" /></div>
        <div className="sm:col-span-2"><label className="label">Study background</label><textarea name="studyBackground" rows={2} defaultValue={person?.studyBackground ?? ''} className="input resize-none" /></div>
        <div className="sm:col-span-2">
          <label className="label">Profile gallery image URLs (one per line)</label>
          <textarea name="profileGallery" rows={2} defaultValue={person?.profileGallery?.join('\n') ?? ''} className="input resize-none" placeholder="https://…" />
        </div>
      </div>

      {state?.error && <p className="text-[12.5px] font-[650] text-[#E51A24]">{state.error}</p>}
      <button disabled={busy} className="btn btn-primary btn-md gap-2 disabled:opacity-70">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {compressing ? 'Optimizing image…' : 'Save person'}
      </button>
    </form>
  );
}

export default function PersonFormModal({ person, open, onClose }: { person: PersonLite; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="glass-strong my-10 w-full max-w-2xl rounded-[30px] p-7">
        <div className="flex items-center justify-between">
          <p className="text-[17px] font-[800] tracking-tight">{person ? 'Edit person' : 'Add teacher / manager'}</p>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5"><X size={17} /></button>
        </div>
        <Inner key={person?.id ?? 'new'} person={person} onDone={onClose} />
      </div>
    </div>
  );
}
