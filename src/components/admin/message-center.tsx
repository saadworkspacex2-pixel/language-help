'use client';

import { useActionState } from 'react';
import { declareOffDay, sendMessage } from '@/lib/actions/people';
import { formatDate } from '@/lib/utils';
import { CalendarX, CheckCircle2, Loader2, Send, Zap } from 'lucide-react';

type Recipient = { id: number; name: string; studentId: string | null };
type BatchOpt = { id: number; label: string };
type Sent = { id: number; title: string; body: string; tone: string; category: string; createdAt: Date; to: string };

const TONES = [
  { k: 'info', label: 'Info', cls: 'bg-sky-100 text-sky-700' },
  { k: 'success', label: 'Success', cls: 'bg-emerald-100 text-emerald-700' },
  { k: 'warning', label: 'Warning', cls: 'bg-amber-100 text-amber-700' },
  { k: 'danger', label: 'Urgent', cls: 'bg-red-100 text-red-700' },
];

const AUTOMATIONS = [
  { t: 'Enrollment received', d: 'Sent the moment a student requests a course.' },
  { t: 'Order verified by Management', d: '“You will soon be called and you have to give the installment by coming at office.”' },
  { t: 'Called but no answer', d: 'Sent when you mark a request as unreachable.' },
  { t: 'Enrollment confirmed', d: 'Includes batch name and class start date.' },
  { t: 'Enrollment failed', d: 'Sent with your reason when a request is rejected.' },
  { t: 'Payment received', d: 'Shows amount paid and remaining balance automatically.' },
  { t: 'Class completed', d: 'Announces progress and the next class date.' },
  { t: 'Class postponed / off day', d: 'Explains the new date and that class numbers continue.' },
  { t: 'Routine published', d: 'Sent when you set or change a batch weekly schedule.' },
  { t: 'Certificate ready', d: 'Fires automatically after the final class is completed.' },
];

export default function MessageCenter({ recipients, batches, sent }: { recipients: Recipient[]; batches: BatchOpt[]; sent: Sent[] }) {
  const [msgState, msgAction, msgPending] = useActionState(sendMessage, null as { ok: boolean; error?: string } | null);
  const [offState, offAction, offPending] = useActionState(declareOffDay, null as { ok: boolean; error?: string; moved?: number } | null);

  return (
    <div className="space-y-7">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose */}
        <form action={msgAction} className="glass rounded-[28px] p-7">
          <p className="flex items-center gap-2 text-[16px] font-[800] tracking-tight"><Send size={16} className="text-[#E51A24]" /> Send a message</p>
          <p className="mt-1 text-[12px] text-[#6C757D]">Delivered instantly to the student portal notification centre.</p>
          <div className="mt-5 space-y-3.5">
            <div>
              <label className="label">Recipient</label>
              <select name="target" className="input">
                <option value="all">Everyone (students + teachers)</option>
                <option value="students">All students</option>
                <option value="teachers">All teachers</option>
                <optgroup label="Individual student">
                  {recipients.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.studentId}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="label">Tone</label>
              <select name="tone" className="input">
                {TONES.map((t) => <option key={t.k} value={t.k}>{t.label}</option>)}
              </select>
            </div>
            <div><label className="label">Title *</label><input name="title" required className="input" placeholder="e.g. Class time changed for Friday" /></div>
            <div><label className="label">Message *</label><textarea name="body" required rows={4} className="input resize-none" /></div>
          </div>
          {msgState?.error && <p className="mt-3 text-[12.5px] font-[650] text-[#E51A24]">{msgState.error}</p>}
          <div className="mt-5 flex items-center gap-3">
            <button disabled={msgPending} className="btn btn-primary btn-md gap-2 disabled:opacity-70">
              {msgPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send message
            </button>
            {msgState?.ok && <span className="flex items-center gap-1.5 text-[12.5px] font-[700] text-emerald-600"><CheckCircle2 size={14} /> Sent</span>}
          </div>
        </form>

        {/* Off day */}
        <div className="space-y-6">
          <form action={offAction} className="glass rounded-[28px] p-7">
            <p className="flex items-center gap-2 text-[16px] font-[800] tracking-tight"><CalendarX size={16} className="text-[#E51A24]" /> Declare an off day</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#6C757D]">
              Classes on that date shift to the next slot automatically. Class numbers keep counting
              correctly and nothing is marked completed.
            </p>
            <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
              <div><label className="label">Date *</label><input name="date" type="date" required className="input" /></div>
              <div>
                <label className="label">Scope</label>
                <select name="scope" className="input">
                  <option value="all">Whole institution</option>
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className="label">Reason</label><input name="reason" className="input" placeholder="e.g. Eid holiday / Public holiday" /></div>
            </div>
            {offState?.error && <p className="mt-3 text-[12.5px] font-[650] text-[#E51A24]">{offState.error}</p>}
            <div className="mt-5 flex items-center gap-3">
              <button disabled={offPending} className="btn btn-dark btn-md gap-2 disabled:opacity-70">
                {offPending ? <Loader2 size={14} className="animate-spin" /> : <CalendarX size={14} />} Reschedule classes
              </button>
              {offState?.ok && <span className="text-[12.5px] font-[700] text-emerald-600">{offState.moved} class(es) moved & students notified</span>}
            </div>
          </form>

          {/* Automations */}
          <div className="rounded-[28px] bg-[#1A1A1A] p-7 text-white">
            <p className="flex items-center gap-2 text-[15px] font-[800] tracking-tight"><Zap size={16} className="text-[#E51A24]" /> Autonomous messages (always on)</p>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {AUTOMATIONS.map((a) => (
                <div key={a.t} className="rounded-2xl bg-white/[0.06] px-4 py-2.5 ring-1 ring-white/10">
                  <p className="text-[12.5px] font-[750]">{a.t}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/50">{a.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="mb-4 text-[17px] font-[800] tracking-tight">Recently delivered</h2>
        <div className="space-y-2.5">
          {sent.map((m) => {
            const tone = TONES.find((t) => t.k === m.tone) ?? TONES[0];
            return (
              <div key={m.id} className="glass flex flex-wrap items-start justify-between gap-3 rounded-[22px] p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-[800] tracking-tight">{m.title}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-[750] ${tone.cls}`}>{m.category}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[#6C757D]">{m.body}</p>
                </div>
                <div className="text-right text-[10.5px] font-[650] text-[#ADB5BD]">
                  <p>{m.to}</p>
                  <p>{formatDate(m.createdAt)}</p>
                </div>
              </div>
            );
          })}
          {!sent.length && <p className="glass rounded-[22px] p-8 text-center text-[13px] text-[#ADB5BD]">No messages delivered yet.</p>}
        </div>
      </div>
    </div>
  );
}
