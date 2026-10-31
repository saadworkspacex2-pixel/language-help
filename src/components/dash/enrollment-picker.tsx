'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestEnrollment } from '@/lib/actions/student';
import { DAYS_SHORT, tk } from '@/lib/utils';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

type BatchLite = { id: number; name: string; status: string; sched: { dayOfWeek: number; time: string }[] };
type CourseLite = {
  id: number; slug: string; title: string; subtitle: string | null; banner: string | null;
  fee: number; offerFee: number | null; bookFee: number; totalClasses: number; batches: BatchLite[];
} | null;

export default function EnrollmentPicker({ courses, enrolledCourseIds }: { courses: CourseLite[]; enrolledCourseIds: number[] }) {
  const [selectedBatch, setSelectedBatch] = useState<Record<number, number>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<Record<number, { ok: boolean; text: string }>>({});
  const router = useRouter();

  async function enroll(courseId: number) {
    setBusyId(courseId);
    const fd = new FormData();
    fd.set('courseId', String(courseId));
    const b = selectedBatch[courseId];
    if (b) fd.set('batchId', String(b));
    const res = await requestEnrollment(fd);
    setBusyId(null);
    setMessage((m) => ({ ...m, [courseId]: { ok: res.ok, text: res.ok ? 'Request sent — management will contact you.' : res.error ?? 'Failed' } }));
    if (res.ok) router.refresh();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {courses.map((c) => {
        if (!c) return null;
        const enrolled = enrolledCourseIds.includes(c.id);
        const eff = c.offerFee ?? c.fee;
        const msg = message[c.id];
        return (
          <div key={c.id} className="glass card-hover flex flex-col rounded-[28px] p-6">
            <div className="flex items-start gap-4">
              <img src={c.banner ?? ''} alt="" className="h-20 w-24 shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0">
                <p className="truncate text-[16px] font-[800] tracking-tight text-[#1A1A1A]">{c.title}</p>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-[#6C757D]">{c.subtitle}</p>
                <p className="mt-1.5 text-[14px] font-[800] text-[#E51A24]">
                  {tk(eff)} <span className="text-[11px] font-[600] text-[#ADB5BD]">+ book {tk(c.bookFee)}</span>
                </p>
              </div>
            </div>

            {c.batches.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[10.5px] font-[750] uppercase tracking-[0.14em] text-[#ADB5BD]">Choose batch</p>
                {c.batches.map((b) => (
                  <label key={b.id} className={`flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 ring-1 transition ${
                    selectedBatch[c.id] === b.id ? 'bg-[#1A1A1A] text-white ring-[#1A1A1A]' : 'bg-white/70 ring-black/[0.07] hover:ring-black/20'
                  }`}>
                    <span className="flex items-center gap-3">
                      <input
                        type="radio" name={`batch-${c.id}`} checked={selectedBatch[c.id] === b.id}
                        onChange={() => setSelectedBatch((s) => ({ ...s, [c.id]: b.id }))}
                        className="accent-[#E51A24]"
                      />
                      <span className="text-[13px] font-[750]">{b.name}</span>
                    </span>
                    <span className={`text-[11.5px] font-[600] ${selectedBatch[c.id] === b.id ? 'text-white/60' : 'text-[#6C757D]'}`}>
                      {b.sched.length ? b.sched.map((s) => DAYS_SHORT[s.dayOfWeek]).join(' & ') : 'TBA'}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {msg && (
              <p className={`mt-3 flex items-center gap-1.5 text-[12.5px] font-[650] ${msg.ok ? 'text-emerald-600' : 'text-[#E51A24]'}`}>
                {msg.ok && <CheckCircle2 size={14} />} {msg.text}
              </p>
            )}

            <button
              onClick={() => enroll(c.id)}
              disabled={enrolled || busyId === c.id}
              className="btn btn-primary btn-md mt-5 w-full gap-2 disabled:opacity-50"
            >
              {busyId === c.id ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
              {enrolled ? 'Already requested' : 'Request enrollment'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
