import Link from 'next/link';
import { ArrowUpRight, BookOpen, Clock, BarChart3 } from 'lucide-react';
import { tk, effectiveFee } from '@/lib/utils';
import type { Course } from '@/db/schema';

export default function CourseCard({ course, teacherName }: { course: Course; teacherName?: string | null }) {
  const eff = effectiveFee(course);
  const hasOffer = course.offerFee !== null && course.offerFee < course.fee;
  return (
    <Link href={`/courses/${course.slug}`} className="group block h-full">
      <article
        className="card-hover relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[#C2C4CA]"
        style={{
          backgroundImage: 'linear-gradient(178deg,#FFFFFF,#F7F9FA 62%,#ECEFF3)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.95), 0 1px 2px rgba(52, 52, 58,.14), 0 14px 28px -18px rgba(52, 52, 58,.6)',
        }}
      >
        {/* mounted photo plate */}
        <div className="p-2.5 pb-0">
          <div className="relative h-52 overflow-hidden rounded-[16px] border border-[#BBBDC3] shadow-[inset_0_0_0_1px_rgba(74, 74, 80,.16)]">
            <img
              src={course.banner ?? '/placeholder-course.jpg'}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#202026]/45 via-transparent to-transparent" />
            {hasOffer && (
              <span
                className="absolute left-3 top-3 rounded-full border border-[#A50F17] px-3 py-1 text-[11px] font-[750] text-white"
                style={{
                  backgroundImage: 'linear-gradient(180deg,#FF525A,#E51A24 55%,#C0121B)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), 0 3px 8px -2px rgba(170,16,26,.6)',
                }}
              >
                Save {tk(course.fee - (course.offerFee ?? 0))}
              </span>
            )}
            <span
              className="absolute bottom-3 left-3 rounded-full border border-[#BEC0C6] px-3 py-1 text-[11px] font-[700] text-[#333339]"
              style={{ backgroundImage: 'linear-gradient(180deg,#FFFFFF,#F4F6F9)', boxShadow: 'inset 0 1px 0 #fff, 0 2px 4px rgba(31, 31, 37,.28)' }}
            >
              {course.level ?? 'All levels'}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-[17px] font-[750] tracking-tight text-[#202026] transition-colors group-hover:text-[#C8151F]">
            {course.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-[13px] text-[#65656B]">{course.subtitle}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-[600] text-[#65656B]">
            <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-[#C8151F]" />{course.durationWeeks ?? '—'} weeks · {course.totalClasses} classes</span>
            <span className="inline-flex items-center gap-1.5"><BarChart3 size={13} className="text-[#C8151F]" />{course.ageRange ?? 'Any age'}</span>
            <span className="inline-flex items-center gap-1.5"><BookOpen size={13} className="text-[#C8151F]" />Book {tk(course.bookFee)}</span>
          </div>

          <div className="mt-5 flex items-end justify-between border-t border-dashed border-[#ACAEB4] pt-4">
            <div>
              {hasOffer && <p className="text-[12px] font-[550] text-[#9B9DA3] line-through">{tk(course.fee)}</p>}
              <p className="text-[19px] font-[800] tracking-tight text-[#202026]">
                {tk(eff)}
                {teacherName && <span className="ml-2 align-middle text-[11px] font-[600] text-[#65656B]">by {teacherName}</span>}
              </p>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#121218] text-[#EDEFEF] transition-all duration-500 group-hover:border-[#A50F17]"
              style={{
                backgroundImage: 'linear-gradient(180deg,#404046,#26262C 55%,#17171D)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.16), inset 0 -2px 0 rgba(0,0,0,.55), 0 6px 12px -6px rgba(16, 16, 22,.65)',
              }}
            >
              <ArrowUpRight size={16} className="transition-transform duration-500 group-hover:rotate-45" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
