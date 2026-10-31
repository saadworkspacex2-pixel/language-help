'use client';

import { useState } from 'react';
import { saveAttendance } from '@/lib/actions/admin';
import { formatDate } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

type SessionLite = { id: number; classNumber: number; date: string; status: string };
type BatchLite = {
  id: number; name: string; sessions: SessionLite[];
  students: { id: number; name: string }[];
  attendance: Record<string, string>;
};
type CourseLite = { id: number; title: string; batches: BatchLite[] };

const STATUS = [
  { key: 'present', label: 'Present', cls: 'bg-emerald-500 text-white', idle: 'hover:bg-emerald-50 hover:text-emerald-600' },
  { key: 'late', label: 'Late', cls: 'bg-amber-400 text-white', idle: 'hover:bg-amber-50 hover:text-amber-600' },
  { key: 'absent', label: 'Absent', cls: 'bg-[#E51A24] text-white', idle: 'hover:bg-red-50 hover:text-[#E51A24]' },
];

export default function AttendanceBoard({ courses }: { courses: CourseLite[] }) {
  const firstCourse = courses.find((c) => c.batches.length > 0) ?? null;
  const [courseId, setCourseId] = useState<number | null>(firstCourse?.id ?? null);
  const [batchId, setBatchId] = useState<number | null>(firstCourse?.batches[0]?.id ?? null);
  const course = courses.find((c) => c.id === courseId) ?? null;
  const batch = course?.batches.find((b) => b.id === batchId) ?? null;
  const [sessionId, setSessionId] = useState<number | null>(batch?.sessions[0]?.id ?? null);
  const session = batch?.sessions.find((s) => s.id === sessionId) ?? null;

  const [marks, setMarks] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const getMark = (studentId: number) =>
    marks[studentId] ?? (sessionId && batch ? batch.attendance[`${sessionId}:${studentId}`] : undefined) ?? 'present';

  async function save() {
    if (!sessionId || !batch) return;
    setBusy(true);
    const entries = batch.students.map((s) => ({ studentId: s.id, status: getMark(s.id) }));
    const fd = new FormData();
    fd.set('sessionId', String(sessionId));
    fd.set('entries', JSON.stringify(entries));
    await saveAttendance(fd);
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="space-y-5">
      {/* Selectors */}
      <div className="flex flex-wrap gap-3">
        <select
          className="input !w-56" value={courseId ?? ''}
          onChange={(e) => {
            const c = courses.find((x) => x.id === Number(e.target.value)) ?? null;
            setCourseId(c?.id ?? null);
            setBatchId(c?.batches[0]?.id ?? null);
            setSessionId(c?.batches[0]?.sessions[0]?.id ?? null);
            setMarks({});
          }}
        >
          {courses.filter((c) => c.batches.length).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select
          className="input !w-48" value={batchId ?? ''}
          onChange={(e) => {
            const b = course?.batches.find((x) => x.id === Number(e.target.value)) ?? null;
            setBatchId(b?.id ?? null);
            setSessionId(b?.sessions[0]?.id ?? null);
            setMarks({});
          }}
        >
          {course?.batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="input !w-64" value={sessionId ?? ''} onChange={(e) => { setSessionId(Number(e.target.value)); setMarks({}); }}>
          {batch?.sessions.map((s) => (
            <option key={s.id} value={s.id}>
              Class {s.classNumber} · {formatDate(s.date)}{s.status === 'completed' ? ' ✓' : ''}
            </option>
          ))}
        </select>
      </div>

      {batch && session ? (
        <div className="glass rounded-[28px] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] font-[800] tracking-tight">
              {course?.title} · {batch.name} · Class {session.classNumber}
              <span className="ml-2 text-[11.5px] font-[650] text-[#ADB5BD]">{formatDate(session.date)}</span>
            </p>
            <button onClick={save} disabled={busy} className="btn btn-primary btn-md gap-2 disabled:opacity-70">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saved ? 'Saved!' : 'Save attendance'}
            </button>
          </div>

          <div className="mt-5 space-y-2.5">
            {batch.students.map((s, i) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-3.5 ring-1 ring-black/[0.05]">
                <p className="text-[13.5px] font-[750]"><span className="mr-2 text-[11px] font-[800] text-[#ADB5BD]">{String(i + 1).padStart(2, '0')}</span>{s.name}</p>
                <div className="flex gap-1.5">
                  {STATUS.map((st) => (
                    <button
                      key={st.key}
                      onClick={() => setMarks((m) => ({ ...m, [s.id]: st.key }))}
                      className={`rounded-full px-4 py-1.5 text-[11.5px] font-[750] transition-all duration-300 ${
                        getMark(s.id) === st.key ? st.cls : `bg-[#F1F3F5] text-[#6C757D] ${st.idle}`
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!batch.students.length && <p className="py-6 text-center text-[12.5px] text-[#ADB5BD]">No confirmed students in this batch.</p>}
          </div>
        </div>
      ) : (
        <p className="glass rounded-[24px] p-10 text-center text-[13px] text-[#ADB5BD]">
          Generate batch sessions first (Courses → edit course → Generate sessions).
        </p>
      )}
    </div>
  );
}
