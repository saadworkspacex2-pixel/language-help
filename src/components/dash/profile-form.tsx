'use client';

import { useState } from 'react';
import { updateProfile } from '@/lib/actions/student';
import PhotoCropper from '@/components/photo-crop';
import { CheckCircle2, Loader2, Save } from 'lucide-react';

type Initial = {
  name: string; phone: string; whatsapp: string; fatherName: string;
  motherName: string; className: string; address: string; profileImage: string | null;
};

export default function ProfileForm({ initial }: { initial: Initial }) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    const fd = new FormData(e.currentTarget);
    if (photo) fd.set('photo', photo);
    const res = await updateProfile(fd);
    setState(res.ok ? 'done' : 'idle');
    if (res.ok) setTimeout(() => setState('idle'), 2500);
  }

  return (
    <form onSubmit={handle}>
      <PhotoCropper onFile={setPhoto} initial={initial.profileImage} label="Profile Picture" />
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Full Name</label>
          <input name="name" defaultValue={initial.name} className="input" required />
        </div>
        <div>
          <label className="label">Class</label>
          <input name="className" defaultValue={initial.className} className="input" placeholder="e.g. Class 11" />
        </div>
        <div>
          <label className="label">Phone Number</label>
          <input name="phone" defaultValue={initial.phone} className="input" />
        </div>
        <div>
          <label className="label">WhatsApp Number</label>
          <input name="whatsapp" defaultValue={initial.whatsapp} className="input" />
        </div>
        <div>
          <label className="label">Father&apos;s Name</label>
          <input name="fatherName" defaultValue={initial.fatherName} className="input" />
        </div>
        <div>
          <label className="label">Mother&apos;s Name</label>
          <input name="motherName" defaultValue={initial.motherName} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Home Address</label>
          <textarea name="address" defaultValue={initial.address} rows={2} className="input resize-none" />
        </div>
      </div>
      <button disabled={state === 'loading'} className="btn btn-primary btn-md mt-7 gap-2 disabled:opacity-70">
        {state === 'loading' ? <Loader2 size={15} className="animate-spin" /> : state === 'done' ? <CheckCircle2 size={15} /> : <Save size={15} />}
        {state === 'done' ? 'Saved' : 'Save profile'}
      </button>
    </form>
  );
}
