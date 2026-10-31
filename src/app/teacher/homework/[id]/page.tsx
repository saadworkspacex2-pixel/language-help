import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { homework, homeworkAssignees, homeworkSubmissions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import SubmissionMarker from '@/components/dash/submission-marker';

export const dynamic = 'force-dynamic';

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('teacher');
  const { id } = await params;
  const hw = (await db.select().from(homework).where(eq(homework.id, Number(id))).limit(1))[0];
  if (!hw) notFound();

  const assignees = await db.select({ studentId: homeworkAssignees.studentId }).from(homeworkAssignees).where(eq(homeworkAssignees.homeworkId, hw.id));
  const subs = await db.select().from(homeworkSubmissions).where(eq(homeworkSubmissions.homeworkId, hw.id));

  const rows = await Promise.all(
    assignees.map(async (a) => {
      const u = (await db.select({ id: users.id, name: users.name, profileImage: users.profileImage, studentId: users.studentId })
        .from(users).where(eq(users.id, a.studentId)).limit(1))[0];
      const sub = subs.find((s) => s.studentId === a.studentId) ?? null;
      return {
        student: u ?? { id: a.studentId, name: 'Unknown', profileImage: null, studentId: null },
        submission: sub ? {
          id: sub.id, imageUrl: sub.imageUrl, note: sub.note, marks: sub.marks,
          feedback: sub.feedback, status: sub.status, submittedAt: sub.submittedAt,
        } : null,
      };
    }),
  );
  void user;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/teacher/homework" className="inline-flex items-center gap-2 text-[13px] font-[650] text-[#6C757D] transition hover:text-[#1A1A1A]">
        <ArrowLeft size={15} /> All homework
      </Link>

      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-[28px] p-7">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A1A1A] text-white"><ClipboardList size={19} /></span>
          <div>
            <h1 className="text-[19px] font-[800] tracking-tight">{hw.title}</h1>
            <p className="text-[12px] font-[600] text-[#ADB5BD]">
              {hw.description ?? ''}{hw.dueDate ? ` · Due ${formatDate(hw.dueDate)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 text-[11.5px] font-[750]">
          <span className="rounded-full bg-sky-100 px-3.5 py-1.5 text-sky-700">{subs.length} submitted</span>
          <span className="rounded-full bg-emerald-100 px-3.5 py-1.5 text-emerald-700">{subs.filter((s) => s.status === 'marked').length} marked</span>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r) => <SubmissionMarker key={r.student.id} row={r} />)}
        {!rows.length && <p className="glass rounded-[22px] p-8 text-center text-[13px] text-[#ADB5BD]">No students assigned.</p>}
      </div>
    </div>
  );
}
