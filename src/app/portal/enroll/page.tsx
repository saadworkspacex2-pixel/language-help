import { db } from '@/db';
import { batches, courses, enrollments, schedules } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import EnrollmentPicker from '@/components/dash/enrollment-picker';

export const dynamic = 'force-dynamic';

export default async function PortalEnrollPage() {
  const user = await requireRole('student');
  const activeCourses = await db.select().from(courses).where(eq(courses.active, true)).orderBy(courses.id);
  const myEnrollments = await db.select().from(enrollments).where(eq(enrollments.studentId, user.id));

  const data = await Promise.all(
    activeCourses.map(async (c) => {
      const bs = await db.select().from(batches).where(eq(batches.courseId, c.id));
      const bsWithSched = await Promise.all(
        bs.filter((b) => b.status !== 'completed').map(async (b) => ({
          id: b.id, name: b.name, status: b.status,
          sched: await db.select({ dayOfWeek: schedules.dayOfWeek, time: schedules.time }).from(schedules).where(eq(schedules.batchId, b.id)),
        })),
      );
      return {
        id: c.id, slug: c.slug, title: c.title, subtitle: c.subtitle, banner: c.banner,
        fee: c.fee, offerFee: c.offerFee, bookFee: c.bookFee, totalClasses: c.totalClasses,
        batches: bsWithSched,
      };
    }),
  );
  void inArray;

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Enrollment</p>
      <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
        Request a new <span className="font-serif-accent font-normal italic text-[#6C757D]">enrollment.</span>
      </h1>
      <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-[#6C757D]">
        Choose your course and preferred batch. Management will confirm your request and the
        course will appear in your portal. You can enroll in multiple courses.
      </p>
      <div className="mt-9">
        <EnrollmentPicker courses={data} enrolledCourseIds={myEnrollments.map((e) => e.courseId)} />
      </div>
    </div>
  );
}
