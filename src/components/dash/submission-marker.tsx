'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { markSubmission } from '@/lib/actions/teacher';
import { formatDate } from '@/lib/utils';
import { Check, Clock4, Eye, Loader2, RotateCcw, X } from 'lucide-react';

type Row = {
  student: { id: number; name: string; profileImage: string | null; studentId: string | null };
  submission: {
    id: number; imageUrl: string; note: string | null; marks: string | null;
    feedback: string | null; status: string; submittedAt: Date;
  } | null;
};

export default function SubmissionMarker({ row }: { row: Row }) {
  const [viewer, setViewer] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const sub = row.submission;

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    fd.set('submissionId', String(sub?.id ?? ''));
    await markSubmission(fd);
    setBusy(false);
    setExpanded(false);
  }

  async function unmark() {
    setBusy(true);
    const fd = new FormData();
    fd.set('submissionId', String(sub?.id ?? ''));
    fd.set('unmark', '1');
    await markSubmission(fd);
    setBusy(false);
    setExpanded(false);
  }

  return (
    <div className="glass rounded-[24px] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {row.student.profileImage ? (
            <img src={row.student.profileImage} alt="" className="h-12 w-12 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A1A1A] font-[800] text-white">{row.student.name[0]}</span>
          )}
          <div>
            <p className="text-[14px] font-[800] tracking-tight">{row.student.name}</p>
            <p className="text-[11px] font-[600] text-[#ADB5BD]">{row.student.studentId ?? '—'}</p>
          </div>
        </div>

        {sub ? (
          <div className="flex items-center gap-2.5">
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-[750] ${
              sub.status === 'marked' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
            }`}>
              {sub.status === 'marked' ? <Check size={12} /> : <Clock4 size={12} />}
              {sub.status === 'marked' ? `Marked${sub.marks ? ` · ${sub.marks}` : ''}` : 'Awaiting marks'}
            </span>
            <button onClick={() => setViewer(true)} className="btn btn-outline btn-sm gap-1.5"><Eye size={13} /> View</button>
            <button onClick={() => setExpanded((v) => !v)} className="btn btn-dark btn-sm">{expanded ? 'Close' : sub.status === 'marked' ? 'Edit marks' : 'Mark'}</button>
          </div>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-[750] text-amber-700">Not submitted</span>
        )}
      </div>

      {sub && (
        <p className="mt-2.5 text-[11.5px] font-[600] text-[#ADB5BD]">
          Submitted {formatDate(sub.submittedAt)}{sub.note ? ` · “${sub.note}”` : ''}
        </p>
      )}

      <AnimatePresence>
        {expanded && sub && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            onSubmit={save} className="overflow-hidden"
          >
            <div className="mt-4 grid gap-3 rounded-2xl bg-[#F8F9FA] p-4 sm:grid-cols-[140px_1fr_auto]">
              <input name="marks" defaultValue={sub.marks ?? ''} className="input" placeholder="Marks, e.g. 9/10" />
              <input name="feedback" defaultValue={sub.feedback ?? ''} className="input" placeholder="Feedback for the student" />
              <div className="flex gap-2">
                <button disabled={busy} className="btn btn-primary btn-sm gap-1.5 disabled:opacity-70">
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                </button>
                <button type="button" onClick={unmark} disabled={busy} title="Unmark" className="btn btn-outline btn-sm">
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewer && sub && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md" onClick={() => setViewer(false)}>
            <motion.div initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }} className="relative max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
              <img src={sub.imageUrl} alt="Homework submission" className="max-h-[80vh] w-auto rounded-[24px] shadow-2xl" />
              <button onClick={() => setViewer(false)} className="absolute -top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"><X size={16} /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
