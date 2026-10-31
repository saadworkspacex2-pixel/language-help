'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createHomework, deleteHomework } from '@/lib/actions/teacher';
import { formatDate } from '@/lib/utils';
import { ArrowRight, CheckCircle2, ClipboardList, Loader2, Plus, Trash2 } from 'lucide-react';

type BatchLite = { id: number; name: string; students: { id: number; name: string }[] };
type CourseLite = { id: number; title: string; batches: BatchLite[] };
type HWLite = { id: number; title: string; dueDate: string | null; courseTitle: string; assigned: number; submitted: number; marked: number };

export default function HomeworkManager({ courses, homework }: { courses: CourseLite[]; homework: HWLite[] }) {
  const [showForm, setShowForm] = useState(false);
  const [courseId, setCourseId] = useState<number | null>(courses[0]?.id ?? null);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const course = courses.find((c) => c.id === courseId) ?? null;
  const students = batchId
    ? course?.batches.find((b) => b.id === batchId)?.students ?? []
    : [...new Map(course?.batches.flatMap((b) => b.students).map((s) => [s.id, s]) ?? []).values()];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('courseId', String(courseId ?? ''));
    if (batchId) fd.set('batchId', String(batchId));
    selected.forEach((id) => fd.append('students', String(id)));
    const res = await createHomework(fd);
    setBusy(false);
    if (res.ok) {
      setShowForm(false);
      setSelected([]);
    } else setError(res.error ?? 'Failed to create homework.');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setShowForm((v) => !v)} className="btn btn-dark btn-md gap-1.5">
          <Plus size={15} /> New homework
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="glass rounded-[28px] p-7">
          <p className="text-[16px] font-[800] tracking-tight">Create homework</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Course</label>
              <select
                className="input" value={courseId ?? ''}
                onChange={(e) => { setCourseId(Number(e.target.value)); setBatchId(null); setSelected([]); }}
              >
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Batch (optional — pick to filter students)</label>
              <select className="input" value={batchId ?? ''} onChange={(e) => { setBatchId(e.target.value ? Number(e.target.value) : null); setSelected([]); }}>
                <option value="">All students</option>
                {course?.batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Title *</label>
              <input name="title" required className="input" placeholder="e.g. Write 10 sentences in past tense" />
            </div>
            <div>
              <label className="label">Due date</label>
              <input name="dueDate" type="date" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea name="description" rows={2} className="input resize-none" placeholder="Instructions for students…" />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Assign to students * ({selected.length} selected)</label>
              <button
                type="button"
                onClick={() => setSelected(selected.length === students.length ? [] : students.map((s) => s.id))}
                className="text-[11.5px] font-[700] text-[#E51A24] hover:underline"
              >
                {selected.length === students.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="grid max-h-56 gap-2 overflow-y-auto rounded-2xl bg-[#F8F9FA] p-3 sm:grid-cols-3">
              {students.map((s) => (
                <label key={s.id} className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-[650] ring-1 transition ${
                  selected.includes(s.id) ? 'bg-[#1A1A1A] text-white ring-[#1A1A1A]' : 'bg-white ring-black/[0.06] hover:ring-black/20'
                }`}>
                  <input
                    type="checkbox" checked={selected.includes(s.id)} className="hidden"
                    onChange={() => setSelected((v) => (v.includes(s.id) ? v.filter((x) => x !== s.id) : [...v, s.id]))}
                  />
                  {selected.includes(s.id) && <CheckCircle2 size={13} className="text-[#E51A24]" />}
                  {s.name}
                </label>
              ))}
              {!students.length && <p className="col-span-3 p-4 text-center text-[12.5px] text-[#ADB5BD]">No confirmed students in this course yet.</p>}
            </div>
          </div>

          {error && <p className="mt-3 text-[12.5px] font-[650] text-[#E51A24]">{error}</p>}
          <button disabled={busy} className="btn btn-primary btn-md mt-5 gap-2 disabled:opacity-70">
            {busy && <Loader2 size={14} className="animate-spin" />} Assign homework
          </button>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {homework.map((hw) => (
          <div key={hw.id} className="glass card-hover flex flex-wrap items-center justify-between gap-4 rounded-[24px] p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1A1A1A] text-white"><ClipboardList size={17} /></span>
              <div>
                <p className="text-[14.5px] font-[800] tracking-tight">{hw.title}</p>
                <p className="text-[11.5px] font-[600] text-[#ADB5BD]">
                  {hw.courseTitle}{hw.dueDate ? ` · Due ${formatDate(hw.dueDate)}` : ''} · {hw.assigned} assigned
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-[750] text-sky-700">{hw.submitted} submitted</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-[750] text-emerald-700">{hw.marked} marked</span>
              <Link href={`/teacher/homework/${hw.id}`} className="btn btn-dark btn-sm gap-1.5">Submissions <ArrowRight size={13} /></Link>
              <form action={async (fd) => { await deleteHomework(fd); }}>
                <input type="hidden" name="id" value={hw.id} />
                <button className="flex h-8 w-8 items-center justify-center rounded-xl text-[#ADB5BD] transition hover:bg-red-50 hover:text-[#E51A24]" title="Delete">
                  <Trash2 size={14} />
                </button>
              </form>
            </div>
          </div>
        ))}
        {!homework.length && (
          <div className="glass rounded-[24px] p-10 text-center text-[13px] text-[#ADB5BD]">
            No homework yet — create your first assignment above.
          </div>
        )}
      </div>
    </div>
  );
}
