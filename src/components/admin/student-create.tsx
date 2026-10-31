'use client';

import { useActionState, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createStudent } from '@/lib/actions/people';
import PhotoCropper from '@/components/photo-crop';
import { CheckCircle2, Loader2, UserPlus, X } from 'lucide-react';

export default function StudentCreate() {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: unknown, fd: FormData) => {
      if (photo) fd.set('photo', photo);
      return createStudent(prev, fd);
    },
    null as { ok: boolean; error?: string; studentId?: string } | null,
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-md gap-2">
        <UserPlus size={15} /> Add student profile
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.94, y: 28 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 28 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong my-10 w-full max-w-2xl rounded-[30px] p-7 md:p-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[18px] font-[800] tracking-tight">Create official student profile</p>
                  <p className="mt-0.5 text-[12.5px] text-[#6C757D]">A Student ID is generated automatically and the student is notified.</p>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-black/5"><X size={17} /></button>
              </div>

              {state?.ok ? (
                <div className="py-10 text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={30} /></span>
                  <p className="mt-5 text-[19px] font-[800] tracking-tight">Student profile created</p>
                  <p className="mt-2 text-[13.5px] text-[#6C757D]">
                    Student ID: <span className="font-[800] text-[#E51A24]">{state.studentId}</span>
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <button onClick={() => setOpen(false)} className="btn btn-dark btn-md">Done</button>
                    <button onClick={() => window.location.reload()} className="btn btn-outline btn-md">Add another</button>
                  </div>
                </div>
              ) : (
                <form action={formAction} className="mt-6">
                  <PhotoCropper onFile={setPhoto} label="Student photo (crop before saving)" />
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div><label className="label">Full Name *</label><input name="name" required className="input" /></div>
                    <div><label className="label">Class</label><input name="className" className="input" placeholder="e.g. Class 10 / HSC" /></div>
                    <div><label className="label">Email *</label><input name="email" type="email" required className="input" /></div>
                    <div><label className="label">Login password *</label><input name="password" required minLength={6} className="input" placeholder="Min 6 characters" /></div>
                    <div><label className="label">Phone</label><input name="phone" className="input" /></div>
                    <div><label className="label">WhatsApp</label><input name="whatsapp" className="input" /></div>
                    <div><label className="label">Father&apos;s Name</label><input name="fatherName" className="input" /></div>
                    <div><label className="label">Mother&apos;s Name</label><input name="motherName" className="input" /></div>
                    <div><label className="label">Age</label><input name="age" type="number" className="input" /></div>
                    <div><label className="label">Student ID (blank = auto)</label><input name="studentId" className="input" placeholder="LHBD-2026-####" /></div>
                    <div className="sm:col-span-2"><label className="label">Home Address</label><textarea name="address" rows={2} className="input resize-none" /></div>
                  </div>

                  {state?.error && <p className="mt-4 text-[13px] font-[650] text-[#E51A24]">{state.error}</p>}

                  <button disabled={pending} className="btn btn-primary btn-md mt-6 w-full gap-2 disabled:opacity-70">
                    {pending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Create student
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
