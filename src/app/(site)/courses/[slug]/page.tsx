import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { courses, users, batches, schedules, books, bookVariants } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { Reveal, ScaleIn } from '@/components/motion';
import { ArrowRight, BarChart3, CalendarRange, Check, Clock, Users } from 'lucide-react';
import CoursePurchase from '@/components/site/course-purchase';
import { DAYS_SHORT, formatDate, tk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CourseDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = (await db.select().from(courses).where(eq(courses.slug, slug)).limit(1))[0];
  if (!course) notFound();

  const teacher = course.teacherId
    ? (await db.select().from(users).where(eq(users.id, course.teacherId)).limit(1))[0]
    : null;

  const courseBatches = await db.select().from(batches).where(eq(batches.courseId, course.id));
  const batchIds = courseBatches.map((b) => b.id);
  const sched = batchIds.length
    ? await db.select().from(schedules).where(inArray(schedules.batchId, batchIds))
    : [];
  const hasOffer = course.offerFee !== null && course.offerFee < course.fee;
  const bookRow = (await db.select().from(books).where(eq(books.courseId, course.id)).limit(1))[0] ?? null;
  const bookOption = bookRow
    ? {
        id: bookRow.id, slug: bookRow.slug, title: bookRow.title, subtitle: bookRow.subtitle,
        coverImage: bookRow.coverImage, hasPdf: !!bookRow.previewPdf,
        variants: (await db.select().from(bookVariants).where(eq(bookVariants.bookId, bookRow.id)))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((v) => ({ id: v.id, name: v.name, kind: v.kind, price: v.price, offerPrice: v.offerPrice, inStock: v.inStock })),
      }
    : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-28 md:pt-32">
      {/* Banner hero */}
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] shadow-[0_30px_80px_rgba(26,26,26,0.2)]">
            <img src={course.banner ?? ''} alt={course.title} className="h-[380px] w-full object-cover md:h-[460px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-12">
              {hasOffer && (
                <span className="mb-4 inline-block rounded-full bg-[#E51A24] px-4 py-1.5 text-[12px] font-[700] text-white shadow-lg">
                  Limited offer — save {tk(course.fee - (course.offerFee ?? 0))}
                </span>
              )}
              <h1 className="max-w-3xl text-[clamp(1.9rem,4.6vw,3.6rem)] font-[800] leading-[1.04] tracking-[-0.03em] text-white">
                {course.title}
              </h1>
              <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-white/75">{course.subtitle}</p>
            </div>
          </div>
        </Reveal>
      </div>

      <CoursePurchase
        course={{ slug: course.slug, fee: course.fee, offerFee: course.offerFee, bookFee: course.bookFee, totalClasses: course.totalClasses }}
        book={bookOption}
      >
        <>
          {/* Meta chips */}
          <Reveal>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              {[
                { icon: BarChart3, l: 'Level', v: course.level ?? 'All levels' },
                { icon: Users, l: 'Recommended age', v: course.ageRange ?? 'Any age' },
                { icon: Clock, l: 'Duration', v: `${course.durationWeeks ?? '—'} weeks` },
                { icon: CalendarRange, l: 'Total classes', v: `${course.totalClasses} classes` },
              ].map((m) => (
                <div key={m.l} className="glass-soft rounded-3xl p-4.5 p-5">
                  <m.icon size={17} className="text-[#E51A24]" />
                  <p className="mt-3 text-[10.5px] font-[700] uppercase tracking-[0.14em] text-[#ADB5BD]">{m.l}</p>
                  <p className="mt-0.5 text-[14px] font-[750] tracking-tight text-[#1A1A1A]">{m.v}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Description */}
          <Reveal>
            <div>
              <h2 className="text-[24px] font-[800] tracking-tight text-[#1A1A1A]">About this course</h2>
              <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.85] text-[#495057]">{course.description}</p>
            </div>
          </Reveal>

          {/* Outcomes */}
          {course.outcomes && course.outcomes.length > 0 && (
            <Reveal>
              <div className="rounded-[30px] bg-white p-8 shadow-[0_12px_44px_rgba(26,26,26,0.07)] ring-1 ring-black/[0.05]">
                <h2 className="text-[22px] font-[800] tracking-tight text-[#1A1A1A]">What you will learn</h2>
                <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {course.outcomes.map((o) => (
                    <div key={o} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E51A24]/10 text-[#E51A24]">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      <p className="text-[14px] font-[550] leading-relaxed text-[#495057]">{o}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* Batches & schedule */}
          {courseBatches.length > 0 && (
            <Reveal>
              <div>
                <h2 className="text-[24px] font-[800] tracking-tight text-[#1A1A1A]">Batches & weekly schedule</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {courseBatches.map((b) => {
                    const bs = sched.filter((s) => s.batchId === b.id);
                    return (
                      <div key={b.id} className="glass-soft rounded-[26px] p-6">
                        <div className="flex items-center justify-between">
                          <p className="text-[15.5px] font-[750] tracking-tight text-[#1A1A1A]">{b.name}</p>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-[700] capitalize ${
                            b.status === 'running' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>{b.status}</span>
                        </div>
                        {b.startDate && (
                          <p className="mt-2 text-[12.5px] font-[550] text-[#6C757D]">Starts {formatDate(b.startDate)}</p>
                        )}
                        <div className="mt-4 space-y-2">
                          {bs.sort((a, z) => a.dayOfWeek - z.dayOfWeek).map((s) => (
                            <div key={s.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 ring-1 ring-black/[0.05]">
                              <span className="text-[13px] font-[700] text-[#1A1A1A]">{DAYS_SHORT[s.dayOfWeek]}</span>
                              <span className="text-[12.5px] font-[600] text-[#6C757D]">{s.time}</span>
                            </div>
                          ))}
                          {!bs.length && <p className="text-[12.5px] text-[#ADB5BD]">Schedule to be announced.</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          )}

          {/* Teacher */}
          {teacher && (
            <Reveal>
              <Link href={`/people/${teacher.id}`} className="group block">
                <div className="card-hover flex items-center gap-6 rounded-[30px] bg-white p-6 shadow-[0_12px_44px_rgba(26,26,26,0.07)] ring-1 ring-black/[0.05] md:p-8">
                  {teacher.profileImage ? (
                    <img src={teacher.profileImage} alt={teacher.name} className="h-20 w-20 rounded-3xl object-cover md:h-24 md:w-24" />
                  ) : (
                    <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#1A1A1A] text-2xl font-[800] text-white md:h-24 md:w-24">{teacher.name[0]}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-[700] uppercase tracking-[0.16em] text-[#ADB5BD]">Course mentor</p>
                    <p className="mt-1 truncate text-[19px] font-[800] tracking-tight text-[#1A1A1A] transition-colors group-hover:text-[#E51A24]">{teacher.name}</p>
                    <p className="mt-0.5 text-[13px] font-[550] text-[#6C757D]">{teacher.experience}</p>
                  </div>
                  <ArrowRight size={20} className="shrink-0 text-[#ADB5BD] transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-[#E51A24]" />
                </div>
              </Link>
            </Reveal>
          )}
        </>
      </CoursePurchase>
    </div>
  );
}
