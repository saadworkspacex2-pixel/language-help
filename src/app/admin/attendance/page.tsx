import { db } from '@/db';
import { attendance, batches, classSessions, courses, enrollments, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import AttendanceBoard from '@/components/admin/attendance-board';

export const dynamic = 'force-dynamic';

export default async function AdminAttendancePage() {
  await requireRole('management');
  const allCourses = await db.select().from(courses);

  const structure = await Promise.all(
    allCourses.map(async (c) => {
      const bs = await db.select().from(batches).where(eq(batches.courseId, c.id));
      const enriched = await Promise.all(
        bs.map(async (b) => {
          const sessions = (await db.select().from(classSessions).where(eq(classSessions.batchId, b.id)))
            .sort((a, z) => a.classNumber - z.classNumber)
            .map((s) => ({ id: s.id, classNumber: s.classNumber, date: s.date, status: s.status }));
          const ens = await db.select({ studentId: enrollments.studentId }).from(enrollments)
            .where(and(eq(enrollments.batchId, b.id), eq(enrollments.status, 'confirmed')));
          const students = (await Promise.all(
            ens.map(async (e) => {
              const u = (await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, e.studentId)).limit(1))[0];
              return u ?? null;
            }),
          )).filter(Boolean) as { id: number; name: string }[];
          const att: Record<string, string> = {};
          for (const s of sessions) {
            const rows = await db.select().from(attendance).where(eq(attendance.sessionId, s.id));
            for (const r of rows) att[`${s.id}:${r.studentId}`] = r.status;
          }
          return { id: b.id, name: b.name, sessions, students, attendance: att };
        }),
      );
      return { id: c.id, title: c.title, batches: enriched.filter((b) => b.sessions.length > 0) };
    }),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Register</p>
        <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
          Attendance <span className="font-serif-accent font-normal italic text-[#6C757D]">book.</span>
        </h1>
        <p className="mt-2 text-[13px] text-[#6C757D]">Pick a course batch, choose a class session, and mark each student.</p>
      </div>
      <AttendanceBoard courses={structure} />
    </div>
  );
}
