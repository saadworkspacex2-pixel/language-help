'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { recordPayment } from '@/lib/actions/admin';
import { Loader2, Plus, X } from 'lucide-react';

export default function RecordPayment({ enrollmentId, outstanding }: { enrollmentId: number; outstanding: number }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    fd.set('enrollmentId', String(enrollmentId));
    await recordPayment(fd);
    setBusy(false);
    setOpen(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> Record payment</button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.form
              initial={{ scale: 0.94, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={submit}
              className="glass-strong w-full max-w-sm rounded-[28px] p-7"
            >
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-[800] tracking-tight">Record payment</p>
                <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-black/5"><X size={16} /></button>
              </div>
              <p className="mt-1 text-[12px] font-[600] text-[#ADB5BD]">Paid manually at the office · outstanding ৳{outstanding.toLocaleString('en-IN')}</p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="label">Amount (৳)</label>
                  <input name="amount" type="number" required min={1} className="input" placeholder="Full or partial amount" />
                </div>
                <div>
                  <label className="label">Note</label>
                  <input name="note" className="input" placeholder="e.g. 1st installment / Full payment / Book fee" />
                </div>
              </div>
              <button disabled={busy} className="btn btn-primary btn-md mt-6 w-full gap-2 disabled:opacity-70">
                {busy && <Loader2 size={14} className="animate-spin" />} Save payment
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
