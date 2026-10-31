'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { submitHomework } from '@/lib/actions/student';
import { compressImage } from '@/lib/compress-image';
import { CalendarClock, CheckCircle2, ImagePlus, Loader2, Send, Star, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type HW = { id: number; title: string; description: string | null; dueDate: string | null };
type Sub = { status: string; marks: string | null; feedback: string | null; imageUrl: string } | null;

export default function HomeworkCard({ hw, submission }: { hw: HW; submission: Sub }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  async function submit() {
    if (!file) return;
    setState('loading');
    const fd = new FormData();
    fd.set('homeworkId', String(hw.id));
    fd.set('note', note);
    fd.set('image', await compressImage(file, 1400, 0.82));
    const res = await submitHomework(fd);
    if (res.ok) {
      setState('done');
      setTimeout(() => { setOpen(false); setState('idle'); }, 900);
    } else {
      setState('error');
      setError(res.error ?? 'Upload failed.');
    }
  }

  const statusChip = submission ? (
    <span className={`rounded-full px-3 py-1 text-[10.5px] font-[750] ${submission.status === 'marked' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
      {submission.status === 'marked' ? 'Marked' : 'Submitted'}
    </span>
  ) : (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-[10.5px] font-[750] text-amber-700">Pending</span>
  );

  return (
    <div className="glass card-hover rounded-[26px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[15.5px] font-[800] tracking-tight text-[#1A1A1A]">{hw.title}</p>
            {statusChip}
          </div>
          {hw.description && <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-[#6C757D]">{hw.description}</p>}
          {hw.dueDate && (
            <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-[650] text-[#ADB5BD]">
              <CalendarClock size={13} className="text-[#E51A24]" /> Due {formatDate(hw.dueDate)}
            </p>
          )}
        </div>
        <button onClick={() => setOpen(true)} className="btn btn-dark btn-sm gap-1.5">
          <ImagePlus size={14} /> {submission ? 'Resubmit' : 'Submit photo'}
        </button>
      </div>

      {submission && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-[#F8F9FA] p-4">
          <img src={submission.imageUrl} alt="Submission" className="h-16 w-16 rounded-xl object-cover ring-1 ring-black/10" />
          <div className="min-w-0 flex-1 text-[12.5px]">
            {submission.status === 'marked' ? (
              <>
                <p className="flex items-center gap-1.5 font-[750] text-[#1A1A1A]">
                  <Star size={13} className="text-[#E51A24]" /> {submission.marks || 'Marked'}
                </p>
                {submission.feedback && <p className="mt-0.5 text-[#6C757D]">{submission.feedback}</p>}
              </>
            ) : (
              <p className="font-[600] text-[#6C757D]">Waiting for your mentor to mark this.</p>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.94, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong w-full max-w-md rounded-[28px] p-7"
            >
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-[800] tracking-tight">Submit homework</p>
                <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-black/5"><X size={16} /></button>
              </div>
              <p className="mt-1 text-[12.5px] text-[#6C757D]">{hw.title}</p>

              <button
                onClick={() => inputRef.current?.click()}
                className="mt-5 flex h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-black/10 bg-[#F8F9FA] text-[#ADB5BD] transition hover:border-[#E51A24] hover:text-[#E51A24]"
              >
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <ImagePlus size={26} />
                    <span className="text-[12.5px] font-[650]">Upload photo from your device</span>
                  </>
                )}
              </button>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />

              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Add a note (optional)" className="input mt-4 resize-none" />

              {state === 'error' && <p className="mt-3 text-[12.5px] font-[600] text-[#E51A24]">{error}</p>}

              <button onClick={submit} disabled={!file || state === 'loading'} className="btn btn-primary btn-md mt-5 w-full gap-2 disabled:opacity-60">
                {state === 'loading' ? <Loader2 size={15} className="animate-spin" /> : state === 'done' ? <CheckCircle2 size={15} /> : <Send size={14} />}
                {state === 'done' ? 'Submitted!' : 'Submit homework'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
