'use client';

import { useState } from 'react';
import {
  addBatch, completeSession, deleteBatch, generateSessions, postponeSession, setSchedule,
} from '@/lib/actions/admin';
import { DAYS_SHORT, formatDate } from '@/lib/utils';
import { CalendarPlus, CheckCircle2, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';

type SessionLite = { id: number; classNumber: number; date: string; status: string; note: string | null };
type BatchLite = {
  id: number; name: string; startDate: string | null; endDate: string | null; status: string;
  sched: { dayOfWeek: number; time: string }[];
  sessions: SessionLite[];
};

export default function BatchManager({ courseId, totalClasses, batches }: { courseId: number; totalClasses: number; batches: BatchLite[] }) {
  const [generating, setGenerating] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, { ok: boolean; text: string }>>({});
  const [postponeId, setPostponeId] = useState<number | null>(null);

  async function gen(batchId: number) {
    setGenerating(batchId);
    const fd = new FormData();
    fd.set('batchId', String(batchId));
    const res = await generateSessions(fd);
    setGenerating(null);
    setMessages((m) => ({ ...m, [batchId]: { ok: res.ok, text: res.ok ? `${totalClasses} sessions generated.` : res.error ?? 'Failed' } }));
  }

  return (
    <div className="glass rounded-[30px] p-7 md:p-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[17px] font-[800] tracking-tight">Batches, schedule & classes</p>
          <p className="mt-1 text-[12px] text-[#6C757D]">Create a batch, set its weekly class days, then generate all {totalClasses} sessions.</p>
        </div>
      </div>

      {/* Add batch */}
      <form action={addBatch} className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl bg-[#F8F9FA] p-4">
        <input type="hidden" name="courseId" value={courseId} />
        <div className="min-w-40 flex-1">
          <label className="label">Batch name</label>
          <input name="name" required className="input" placeholder="e.g. Batch A — Morning" />
        </div>
        <div>
          <label className="label">Start date</label>
          <input name="startDate" type="date" required className="input" />
        </div>
        <button className="btn btn-dark btn-md gap-1.5"><Plus size={14} /> Add batch</button>
      </form>

      <div className="mt-6 space-y-6">
        {batches.map((b) => (
          <div key={b.id} className="rounded-[24px] bg-white p-6 ring-1 ring-black/[0.06]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <p className="text-[14.5px] font-[800] tracking-tight">{b.name}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-[750] capitalize ${
                  b.status === 'running' ? 'bg-emerald-100 text-emerald-700' : b.status === 'completed' ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-700'
                }`}>{b.status}</span>
              </div>
              <div className="flex items-center gap-2 text-[11.5px] font-[650] text-[#6C757D]">
                {b.startDate && <span>{formatDate(b.startDate)} → {b.endDate ? formatDate(b.endDate) : '…'}</span>}
                <form action={async (fd) => { if (confirm('Delete this batch, schedule and sessions?')) await deleteBatch(fd); }}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="flex h-8 w-8 items-center justify-center rounded-xl text-[#ADB5BD] transition hover:bg-red-50 hover:text-[#E51A24]"><Trash2 size={14} /></button>
                </form>
              </div>
            </div>

            {/* Schedule editor */}
            <form action={setSchedule} className="mt-4 flex flex-wrap items-center gap-2.5">
              <input type="hidden" name="batchId" value={b.id} />
              {DAYS_SHORT.map((d, i) => (
                <label key={d} className="cursor-pointer">
                  <input type="checkbox" name="days" value={i} defaultChecked={b.sched.some((s) => s.dayOfWeek === i)} className="peer hidden" />
                  <span className="block rounded-full bg-[#F1F3F5] px-3.5 py-1.5 text-[11.5px] font-[750] text-[#6C757D] ring-1 ring-transparent transition peer-checked:bg-[#1A1A1A] peer-checked:text-white">
                    {d}
                  </span>
                </label>
              ))}
              <input name="time" defaultValue={b.sched[0]?.time ?? ''} required className="input !w-44" placeholder="e.g. 5:00 – 6:30 PM" />
              <button className="btn btn-outline btn-sm">Save schedule</button>
            </form>

            {/* Generate */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {b.sessions.length === 0 ? (
                <button onClick={() => gen(b.id)} disabled={generating === b.id} className="btn btn-primary btn-sm gap-1.5 disabled:opacity-70">
                  {generating === b.id ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Generate {totalClasses} sessions
                </button>
              ) : (
                <span className="flex items-center gap-1.5 text-[12px] font-[700] text-emerald-600">
                  <CalendarPlus size={13} /> {b.sessions.filter((s) => s.status === 'completed').length}/{b.sessions.length} classes completed
                </span>
              )}
              {messages[b.id] && (
                <span className={`text-[12px] font-[650] ${messages[b.id].ok ? 'text-emerald-600' : 'text-[#E51A24]'}`}>{messages[b.id].text}</span>
              )}
            </div>

            {/* Sessions */}
            {b.sessions.length > 0 && (
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                {b.sessions.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#F8F9FA] px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-[800] ${
                        s.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-white text-[#6C757D] ring-1 ring-black/10'
                      }`}>{s.classNumber}</span>
                      <div>
                        <p className="text-[12.5px] font-[700]">{formatDate(s.date)}</p>
                        {s.note && <p className="text-[10.5px] font-[600] text-sky-600">{s.note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.status !== 'completed' ? (
                        <>
                          {postponeId === s.id ? (
                            <form
                              action={async (fd) => { await postponeSession(fd); setPostponeId(null); }}
                              className="flex items-center gap-1.5"
                            >
                              <input type="hidden" name="id" value={s.id} />
                              <input type="date" name="newDate" required className="input !w-40 !py-1.5 text-xs" />
                              <button className="btn btn-dark btn-sm">Move</button>
                            </form>
                          ) : (
                            <button onClick={() => setPostponeId(s.id)} className="btn btn-outline btn-sm">Postpone</button>
                          )}
                          <form action={completeSession}>
                            <input type="hidden" name="id" value={s.id} />
                            <button className="btn btn-primary btn-sm gap-1"><CheckCircle2 size={12} /> Complete</button>
                          </form>
                        </>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10.5px] font-[750] text-emerald-700">completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {!batches.length && <p className="rounded-2xl bg-[#F8F9FA] p-6 text-center text-[12.5px] text-[#ADB5BD]">No batches yet.</p>}
      </div>
    </div>
  );
}
