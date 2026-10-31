import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/session';
import { getEnrollmentDetail } from '@/lib/student-data';
import { DAYS_SHORT, formatDate, tk } from '@/lib/utils';
import {
  ArrowLeft, Award, CalendarRange, CheckCircle2, CircleDashed, Clock,
  ArrowRight, Wallet, BookOpen,
} from 'lucide-react';
import HomeworkCard from '@/components/dash/homework-card';

export const dynamic = 'force-dynamic';

export default async function PortalCourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('student');
  const { id } = await params;
  const data = await getEnrollmentDetail(Number(id), user.id);
  if (!data) notFound();
  const { bundle: b, myAttendance, homework, submissions, teacher } = data;
  const pct = b.course ? Math.round((b.completedCount / (b.course.totalClasses || 1)) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link href="/portal" className="inline-flex items-center gap-2 text-[13px] font-[650] text-[#6C757D] transition hover:text-[#1A1A1A]">
        <ArrowLeft size={15} /> Back to overview
      </Link>

      {/* Header */}
      <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_14px_50px_rgba(26,26,26,0.08)] ring-1 ring-black/[0.05]">
        <div className="relative h-52">
          <img src={b.course?.banner ?? ''} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[26px] font-[800] tracking-tight text-white">{b.course?.title}</h1>
              <p className="text-[12.5px] font-[600] text-white/70">
                {b.batch ? `${b.batch.name} · ` : ''}Started {formatDate(b.batch?.startDate)} {b.batch?.endDate ? `· Ends ${formatDate(b.batch.endDate)}` : ''}
              </p>
            </div>
            <span className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-[750] capitalize ${
              b.enrollment.status === 'confirmed' ? 'bg-emerald-400/90 text-emerald-950' : 'bg-amber-300/90 text-amber-950'
            }`}>{b.enrollment.status}</span>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[1fr_1fr] md:p-8">
          <div>
            <p className="text-[11px] font-[700] uppercase tracking-[0.16em] text-[#ADB5BD]">Course progress</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/[0.07]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#1A1A1A] to-[#E51A24] transition-all duration-1000" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[14px] font-[800] text-[#1A1A1A]">{b.completedCount}/{b.course?.totalClasses}</p>
            </div>
            <p className="mt-2 text-[12px] font-[600] text-[#6C757D]">
              {b.completedCount === (b.course?.totalClasses ?? 0)
                ? 'Course completed — congratulations!'
                : `Currently at class ${b.completedCount + 1}. Certificate unlocks after class ${b.course?.totalClasses}.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            {b.sched.map((s) => (
              <span key={s.id} className="glass-soft flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[12.5px] font-[700] text-[#1A1A1A]">
                <Clock size={13} className="text-[#E51A24]" /> {DAYS_SHORT[s.dayOfWeek]} · {s.time}
              </span>
            ))}
            {b.next && (
              <span className="flex items-center gap-2 rounded-2xl bg-[#1A1A1A] px-4 py-2.5 text-[12.5px] font-[700] text-white">
                <CalendarRange size={13} className="text-[#E51A24]" /> Next: Class {b.next.classNumber} on {formatDate(b.next.date)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          {/* Class schedule / attendance */}
          <div>
            <h2 className="mb-4 text-[19px] font-[800] tracking-tight">Classes & attendance</h2>
            <div className="overflow-hidden rounded-[26px] bg-white ring-1 ring-black/[0.05]">
              <div className="max-h-[420px] overflow-y-auto">
                {b.sessions.map((s) => {
                  const att = myAttendance.find((a) => a.sessionId === s.id);
                  return (
                    <div key={s.id} className="flex items-center justify-between border-b border-black/[0.05] px-6 py-3.5 last:border-0">
                      <div className="flex items-center gap-3.5">
                        {s.status === 'completed' ? (
                          <CheckCircle2 size={17} className="shrink-0 text-emerald-500" />
                        ) : (
                          <CircleDashed size={17} className="shrink-0 text-[#CED4DA]" />
                        )}
                        <div>
                          <p className="text-[13.5px] font-[750] text-[#1A1A1A]">Class {s.classNumber}</p>
                          {s.note && <p className="text-[11px] font-[550] text-sky-600">{s.note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-[600] text-[#ADB5BD]">{formatDate(s.date)}</span>
                        {att ? (
                          <span className={`w-16 rounded-full py-1 text-center text-[10.5px] font-[750] capitalize ${
                            att.status === 'present' ? 'bg-emerald-100 text-emerald-700' : att.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>{att.status}</span>
                        ) : (
                          <span className={`w-16 rounded-full py-1 text-center text-[10.5px] font-[750] capitalize ${
                            s.status === 'completed' ? 'bg-gray-100 text-gray-500' : 'bg-sky-50 text-sky-600'
                          }`}>{s.status === 'completed' ? '—' : 'upcoming'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!b.sessions.length && <p className="p-8 text-center text-[13px] text-[#ADB5BD]">Classes will appear after your batch schedule is generated.</p>}
              </div>
            </div>
          </div>

          {/* Homework */}
          <div>
            <h2 className="mb-4 text-[19px] font-[800] tracking-tight">Homework</h2>
            <div className="space-y-4">
              {homework.map((hw) => (
                <HomeworkCard
                  key={hw.id}
                  hw={{ id: hw.id, title: hw.title, description: hw.description, dueDate: hw.dueDate }}
                  submission={submissions.find((s) => s.homeworkId === hw.id) ?? null}
                />
              ))}
              {!homework.length && (
                <div className="glass rounded-[26px] p-8 text-center text-[13px] text-[#ADB5BD]">
                  No homework assigned yet — enjoy the calm before the storm.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Payment summary */}
          <div className="glass rounded-[26px] p-6">
            <h3 className="flex items-center gap-2 text-[15px] font-[800] tracking-tight"><Wallet size={16} className="text-[#E51A24]" /> Payment</h3>
            <div className="mt-4 space-y-2.5 text-[13px] font-[650]">
              <div className="flex justify-between"><span className="text-[#6C757D]">Course fee</span><span>{tk(b.course ? (b.course.offerFee ?? b.course.fee) : 0)}</span></div>
              <div className="flex justify-between"><span className="text-[#6C757D]">Book fee</span><span>{tk(b.course?.bookFee)}</span></div>
              <div className="flex justify-between"><span className="text-[#6C757D]">Paid</span><span className="text-emerald-600">{tk(b.paidSum)}</span></div>
              <div className="flex justify-between border-t border-dashed border-black/10 pt-2.5 text-[15px] font-[800]">
                <span>Outstanding</span>
                <span className={b.outstanding > 0 ? 'text-[#E51A24]' : 'text-emerald-600'}>{tk(b.outstanding)}</span>
              </div>
            </div>
            <Link href="/portal/payments" className="btn btn-dark btn-sm mt-5 w-full gap-1.5">Payment history <ArrowRight size={13} /></Link>
            <p className="mt-3 rounded-2xl bg-[#F8F9FA] p-3 text-[11.5px] leading-relaxed text-[#ADB5BD]">
              Online payment is not available right now — coming soon. Pay at the office; a receipt appears here after each payment.
            </p>
          </div>

          {/* Certificate */}
          <div className={`rounded-[26px] p-6 ${b.certificate ? 'bg-[#1A1A1A] text-white' : 'glass'}`}>
            <h3 className="flex items-center gap-2 text-[15px] font-[800] tracking-tight">
              <Award size={16} className={b.certificate ? 'text-[#E51A24]' : 'text-[#ADB5BD]'} /> Certificate
            </h3>
            {b.certificate ? (
              <>
                <p className="mt-3 text-[13px] text-white/70">Your Certificate of Completion is ready.</p>
                <p className="mt-1 text-[11.5px] font-[650] tracking-wide text-white/45">{b.certificate.serial}</p>
                <Link href={`/portal/certificates/${b.certificate.id}`} className="btn btn-primary btn-sm mt-4 w-full">View & print</Link>
              </>
            ) : (
              <p className="mt-3 text-[12.5px] leading-relaxed text-[#6C757D]">
                <BookOpen size={13} className="mr-1.5 inline text-[#E51A24]" />
                Issued automatically once class {b.course?.totalClasses} is completed.
                You are at class {b.completedCount + 1}.
              </p>
            )}
          </div>

          {/* Teacher */}
          {teacher && (
            <div className="glass flex items-center gap-4 rounded-[26px] p-6">
              {teacher.profileImage ? (
                <img src={teacher.profileImage} alt="" className="h-14 w-14 rounded-2xl object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A1A1A] font-[800] text-white">{teacher.name[0]}</span>
              )}
              <div>
                <p className="text-[10.5px] font-[700] uppercase tracking-[0.14em] text-[#ADB5BD]">Your mentor</p>
                <p className="text-[14.5px] font-[800] tracking-tight">{teacher.name}</p>
                <p className="text-[11.5px] font-[600] text-[#6C757D]">{teacher.experience}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
