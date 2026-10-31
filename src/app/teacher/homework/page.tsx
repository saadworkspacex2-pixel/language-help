import { db } from '@/db';
import { batches, courses, enrollments, homework, homeworkAssignees, homeworkSubmissions, users } from '@/db/schema';
import { and, desc, eq, } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import HomeworkManager from '@/components/dash/homework-manager';

export const dynamic = 'force-dynamic';

export default async function TeacherHomeworkPage() {
  const user = await requireRole('teacher');
  const myCourses = await db.select().from(courses).where(eq(courses.teacherId, user.id));

  const structure = await Promise.all(
    myCourses.map(async (c) => {
      const bs = await db.select().from(batches).where(eq(batches.courseId, c.id));
      const studentsSeen = new Map<number, string>();
      const batchList = await Promise.all(
        bs.map(async (b) => {
          const ens = await db
            .select({ studentId: enrollments.studentId })
            .from(enrollments)
            .where(and(eq(enrollments.batchId, b.id), eq(enrollments.status, 'confirmed')));
          const students = await Promise.all(
            ens.map(async (e) => {
              const u = (await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, e.studentId)).limit(1))[0];
              if (u) studentsSeen.set(u.id, u.name);
              return u ? { id: u.id, name: u.name } : null;
            }),
          );
          return { id: b.id, name: b.name, students: students.filter(Boolean) as { id: number; name: string }[] };
        }),
      );
      return { id: c.id, title: c.title, batches: batchList };
    }),
  );

  const myHomework = await db.select().from(homework).where(eq(homework.teacherId, user.id)).orderBy(desc(homework.id));
  const hwList = await Promise.all(
    myHomework.map(async (hw) => {
      const assignees = await db.select({ id: homeworkAssignees.id }).from(homeworkAssignees).where(eq(homeworkAssignees.homeworkId, hw.id));
      const subs = await db.select({ status: homeworkSubmissions.status }).from(homeworkSubmissions).where(eq(homeworkSubmissions.homeworkId, hw.id));
      const course = (await db.select({ title: courses.title }).from(courses).where(eq(courses.id, hw.courseId)).limit(1))[0];
      return {
        id: hw.id, title: hw.title, dueDate: hw.dueDate, courseTitle: course?.title ?? '',
        assigned: assignees.length, submitted: subs.length, marked: subs.filter((s) => s.status === 'marked').length,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Homework</p>
      <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
        Assign & <span className="font-serif-accent font-normal italic text-[#6C757D]">review.</span>
      </h1>
      <div className="mt-8">
        <HomeworkManager courses={structure} homework={hwList} />
      </div>
    </div>
  );
}
