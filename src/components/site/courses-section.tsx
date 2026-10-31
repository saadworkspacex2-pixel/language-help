import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion';
import CourseCard from '@/components/site/course-card';
import type { Course, User } from '@/db/schema';
import type { SiteContent } from '@/lib/content';

export default function CoursesSection({ courses, teachers, c }: { courses: Course[]; teachers: Map<number, User>; c: SiteContent }) {
  return (
    <section id="courses" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/60" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal><p className="eyebrow">{c.courses_eyebrow}</p></Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 max-w-xl text-[clamp(2rem,4.4vw,3.4rem)] font-[800] leading-[1.04] tracking-[-0.03em] text-[#202026]">
                {c.courses_title} <span className="font-serif-accent font-normal italic tracking-normal text-[#E51A24]">{c.courses_title_accent}</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <Link href="/courses" className="btn btn-outline btn-md gap-2">View all courses <ArrowRight size={15} /></Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {courses.slice(0, 6).map((course, i) => (
            <Reveal key={course.id} delay={0.06 * i}>
              <CourseCard course={course} teacherName={course.teacherId ? teachers.get(course.teacherId)?.name ?? null : null} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-2.5 text-[12.5px] font-[650] text-[#54545A]">
            {['Course book ৳300 with every program', 'Installment-friendly office payment', 'Certificate of Completion included'].map((t) => (
              <span
                key={t}
                className="rounded-full border border-[#C6C8CE] px-4 py-2"
                style={{
                  backgroundImage: 'linear-gradient(180deg,#FFFFFF,#F5F7FA)',
                  boxShadow: 'inset 0 1px 0 #fff, 0 1px 2px rgba(52, 52, 58,.12), 0 6px 12px -8px rgba(52, 52, 58,.45)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
