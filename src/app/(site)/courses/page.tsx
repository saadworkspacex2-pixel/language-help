import { db } from '@/db';
import { courses, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import CourseCard from '@/components/site/course-card';
import { Reveal } from '@/components/motion';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const [allCourses, people] = await Promise.all([
    db.select().from(courses).where(eq(courses.active, true)).orderBy(courses.id),
    db.select().from(users),
  ]);
  const teachers = new Map(people.map((p) => [p.id, p]));

  return (
    <div className="hero-glow min-h-screen pt-32 md:pt-40">
      <div className="mx-auto max-w-7xl px-6 pb-28">
        <Reveal><p className="text-[12px] font-[750] uppercase tracking-[0.22em] text-[#E51A24]">All Courses</p></Reveal>
        <Reveal delay={0.08}>
          <h1 className="mt-5 max-w-3xl text-[clamp(2.4rem,5.4vw,4.2rem)] font-[800] leading-[1.02] tracking-[-0.035em] text-[#1A1A1A]">
            Pick a language.
            <span className="font-serif-accent font-normal italic tracking-normal text-[#E51A24]"> We&apos;ll handle the rest.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[#6C757D]">
            Every program runs in structured classes with a dedicated mentor, a course book (৳300),
            personal homework feedback and a Certificate of Completion when you finish.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {allCourses.map((c, i) => (
            <Reveal key={c.id} delay={0.05 * i}>
              <CourseCard course={c} teacherName={c.teacherId ? teachers.get(c.teacherId)?.name ?? null : null} />
            </Reveal>
          ))}
        </div>
        {allCourses.length === 0 && (
          <p className="mt-20 text-center text-[#6C757D]">Courses will appear here soon.</p>
        )}
      </div>
    </div>
  );
}
