import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { batches, classSessions, courses, schedules, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import CourseForm from '@/components/admin/course-form';
import BatchManager from '@/components/admin/batch-manager';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('management');
  const { id } = await params;
  const isNew = id === 'new';
  const course = isNew ? null : (await db.select().from(courses).where(eq(courses.id, Number(id))).limit(1))[0];
  if (!isNew && !course) notFound();

  const teachers = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, 'teacher'));

  let batchData: {
    id: number; name: string; startDate: string | null; endDate: string | null; status: string;
    sched: { dayOfWeek: number; time: string }[];
    sessions: { id: number; classNumber: number; date: string; status: string; note: string | null }[];
  }[] = [];

  if (course) {
    const bs = await db.select().from(batches).where(eq(batches.courseId, course.id));
    batchData = await Promise.all(
      bs.map(async (b) => ({
        id: b.id, name: b.name, startDate: b.startDate, endDate: b.endDate, status: b.status,
        sched: await db.select({ dayOfWeek: schedules.dayOfWeek, time: schedules.time }).from(schedules).where(eq(schedules.batchId, b.id)),
        sessions: (await db.select().from(classSessions).where(eq(classSessions.batchId, b.id)))
          .sort((a, z) => a.classNumber - z.classNumber)
          .map((s) => ({ id: s.id, classNumber: s.classNumber, date: s.date, status: s.status, note: s.note })),
      })),
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin/courses" className="inline-flex items-center gap-2 text-[13px] font-[650] text-[#6C757D] transition hover:text-[#1A1A1A]">
        <ArrowLeft size={15} /> All courses
      </Link>
      <CourseForm
        initial={course ? {
          id: course.id, slug: course.slug, title: course.title, subtitle: course.subtitle,
          description: course.description, level: course.level, ageRange: course.ageRange,
          teacherId: course.teacherId, durationWeeks: course.durationWeeks, totalClasses: course.totalClasses,
          fee: course.fee, offerFee: course.offerFee, bookFee: course.bookFee, banner: course.banner,
          outcomes: course.outcomes, active: course.active,
        } : null}
        teachers={teachers}
      />
      {course && <BatchManager courseId={course.id} totalClasses={course.totalClasses} batches={batchData} />}
      {course && (
        <p className="pb-4 text-center text-[11.5px] font-[600] text-[#ADB5BD]">
          Completing class {course.totalClasses} of a batch automatically issues Certificates of Completion to its confirmed students.
        </p>
      )}
    </div>
  );
}
