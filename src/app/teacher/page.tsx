import Link from 'next/link';
import { db } from '@/db';
import { batches, classSessions, courses, enrollments, notices, schedules } from '@/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { DAYS_SHORT, formatDate, todayStr } from '@/lib/utils';
import { ArrowRight, BookOpen, ClipboardList, Users, CalendarDays } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeacherDashboard() {
  const user = await requireRole('teacher');
  const myCourses = await db.select().from(courses).where(eq(courses.teacherId, user.id));

  const rows = await Promise.all(
    myCourses.map(async (c) => {
      const bs = await db.select().from(batches).where(eq(batches.courseId, c.id));
      const enriched = await Promise.all(
        bs.map(async (b) => {
          const sched = await db.select().from(schedules).where(eq(schedules.batchId, b.id));
          const students = await db.select({ id: enrollments.id }).from(enrollments)
            .where(and(eq(enrollments.batchId, b.id), eq(enrollments.status, 'confirmed')));
          const upcoming = await db.select({ id: classSessions.id, date: classSessions.date, classNumber: classSessions.classNumber })
            .from(classSessions)
            .where(and(eq(classSessions.batchId, b.id), eq(classSessions.status, 'scheduled')))
            .orderBy(classSessions.date);
          return { batch: b, sched, studentCount: students.length, next: upcoming.find((s) => s.date >= todayStr()) ?? upcoming[0] ?? null };
        }),
      );
      return { course: c, batches: enriched };
    }),
  );

  const noticeList = await db.select().from(notices).where(inArray(notices.audience, ['all', 'teachers'])).orderBy(desc(notices.id)).limit(4);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">{formatDate(new Date())}</p>
          <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
            Welcome, <span className="font-serif-accent font-normal italic text-[#6C757D]">{user.name}.</span>
          </h1>
        </div>
        <Link href="/teacher/homework" className="btn btn-primary btn-md gap-2">Assign homework <ArrowRight size={15} /></Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {rows.map(({ course, batches: bs }) => (
            <div key={course.id} className="overflow-hidden rounded-[28px] bg-white ring-1 ring-black/[0.05]">
              <div className="flex items-center gap-5 border-b border-black/[0.05] p-6">
                <img src={course.banner ?? ''} alt="" className="h-16 w-24 rounded-2xl object-cover" />
                <div>
                  <p className="flex items-center gap-2 text-[16px] font-[800] tracking-tight text-[#1A1A1A]"><BookOpen size={15} className="text-[#E51A24]" />{course.title}</p>
                  <p className="mt-0.5 text-[12px] font-[600] text-[#ADB5BD]">{course.totalClasses} classes · {course.level}</p>
                </div>
              </div>
              {bs.map(({ batch, sched, studentCount, next }) => (
                <div key={batch.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.04] px-6 py-4 last:border-0">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F3F5] text-[#1A1A1A]"><CalendarDays size={16} /></span>
                    <div>
                      <p className="text-[13.5px] font-[750]">{batch.name}</p>
                      <p className="text-[11.5px] font-[600] text-[#ADB5BD]">
                        {sched.map((s) => `${DAYS_SHORT[s.dayOfWeek]} ${s.time}`).join(' · ') || 'No schedule'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 text-[12px] font-[650]">
                    <span className="flex items-center gap-1.5 text-[#6C757D]"><Users size={13} className="text-[#E51A24]" />{studentCount} students</span>
                    {next && <span className="rounded-full bg-[#F1F3F5] px-3 py-1.5">Class {next.classNumber} · {formatDate(next.date)}</span>}
                  </div>
                </div>
              ))}
              {!bs.length && <p className="px-6 py-5 text-[13px] text-[#ADB5BD]">No batches yet — management will create them.</p>}
            </div>
          ))}
          {!rows.length && (
            <div className="glass rounded-[26px] p-10 text-center text-[13.5px] text-[#6C757D]">
              You are not assigned to any course yet.
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-[17px] font-[800] tracking-tight"><ClipboardList size={16} className="text-[#E51A24]" /> Notices</h2>
          <div className="space-y-3">
            {noticeList.map((n) => (
              <div key={n.id} className="glass rounded-[22px] p-5">
                <p className="text-[13.5px] font-[750]">{n.title}</p>
                {n.body && <p className="mt-1 text-[12.5px] leading-relaxed text-[#6C757D]">{n.body}</p>}
                <p className="mt-2 text-[10.5px] font-[650] text-[#ADB5BD]">{formatDate(n.createdAt)}</p>
              </div>
            ))}
            {!noticeList.length && <p className="glass rounded-[22px] p-6 text-center text-[12.5px] text-[#ADB5BD]">No notices.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
