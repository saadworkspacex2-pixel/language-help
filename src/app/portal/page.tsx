import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { getStudentOverview } from '@/lib/student-data';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import NotificationFeed from '@/components/dash/notification-feed';
import { formatDate, tk, DAYS_SHORT } from '@/lib/utils';
import {
  ArrowRight, ArrowUpRight, Award, BookOpen, CalendarClock, ClipboardList,
  Megaphone, Wallet, BadgeCheck, AlertCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PortalDashboard() {
  const user = await requireRole('student');
  const ov = await getStudentOverview(user.id);
  const myMessages = await db.select().from(messages).where(eq(messages.userId, user.id)).orderBy(desc(messages.id)).limit(25);
  const needsSetup = !user.fatherName || !user.className;

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">{formatDate(new Date())}</p>
          <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
            Hello, {user.name.split(' ')[0]} <span className="font-serif-accent font-normal italic text-[#6C757D]">— ready to learn?</span>
          </h1>
        </div>
        <span className="glass rounded-full px-5 py-2.5 text-[12.5px] font-[700] text-[#1A1A1A]">
          ID · <span className="text-[#E51A24]">{user.studentId}</span>
        </span>
      </div>

      {needsSetup && (
        <Link href="/portal/profile" className="group flex items-center justify-between gap-4 rounded-[26px] bg-[#1A1A1A] p-6 text-white transition-transform duration-500 hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E51A24]"><AlertCircle size={20} /></span>
            <div>
              <p className="text-[15px] font-[750]">Complete your student profile</p>
              <p className="mt-0.5 text-[12.5px] text-white/60">Add your parents&apos; names, class and photo so enrollment goes smoothly.</p>
            </div>
          </div>
          <ArrowRight size={18} className="shrink-0 transition-transform duration-500 group-hover:translate-x-1.5" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BookOpen, l: 'Active courses', v: String(ov.confirmed.length), sub: `${ov.bundles.length - ov.confirmed.length} pending` },
          {
            icon: CalendarClock, l: 'Next class', v: ov.nextUp ? formatDate(ov.nextUp.session.date) : '—',
            sub: ov.nextUp ? `${ov.nextUp.courseTitle} · Class ${ov.nextUp.session.classNumber}` : 'Nothing scheduled',
          },
          { icon: ClipboardList, l: 'Attendance', v: ov.attendancePct !== null ? `${ov.attendancePct}%` : '—', sub: 'this program' },
          { icon: Wallet, l: 'Outstanding', v: tk(ov.outstanding), sub: ov.outstanding > 0 ? 'Payable at office' : 'All clear', warn: ov.outstanding > 0 },
        ].map((s) => (
          <div key={s.l} className="glass card-hover rounded-[26px] p-5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${s.warn ? 'bg-[#E51A24] text-white' : 'bg-[#1A1A1A] text-white'}`}>
              <s.icon size={17} />
            </span>
            <p className="mt-4 text-[24px] font-[800] tracking-tight text-[#1A1A1A]">{s.v}</p>
            <p className="text-[11.5px] font-[650] text-[#6C757D]">{s.l} · <span className={s.warn ? 'text-[#E51A24]' : ''}>{s.sub}</span></p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* My courses */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-[800] tracking-tight">My Courses</h2>
            <Link href="/portal/enroll" className="btn btn-outline btn-sm gap-1.5">Enroll <ArrowUpRight size={13} /></Link>
          </div>
          {ov.bundles.length === 0 && (
            <div className="glass rounded-[26px] p-10 text-center">
              <p className="text-[15px] font-[700] text-[#1A1A1A]">You haven&apos;t enrolled yet</p>
              <p className="mt-1.5 text-[13px] text-[#6C757D]">Pick a course and request enrollment — management will confirm it.</p>
              <Link href="/portal/enroll" className="btn btn-primary btn-md mt-5">Browse courses</Link>
            </div>
          )}
          {ov.bundles.map((b) => (
            <Link key={b.enrollment.id} href={`/portal/courses/${b.enrollment.id}`} className="group block">
              <div className="card-hover glass flex items-center gap-5 rounded-[26px] p-5">
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl">
                  <img src={b.course?.banner ?? ''} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[15.5px] font-[800] tracking-tight text-[#1A1A1A]">{b.course?.title}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-[700] capitalize ${
                      b.enrollment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : b.enrollment.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>{b.enrollment.status}</span>
                  </div>
                  <p className="mt-1 text-[12px] font-[600] text-[#6C757D]">
                    {b.batch ? `${b.batch.name} · ` : ''}{b.completedCount}/{b.course?.totalClasses} classes completed
                    {b.course && b.completedCount > 0 && (
                      <span className="ml-2 inline-block h-1.5 w-20 overflow-hidden rounded-full bg-black/[0.08] align-middle">
                        <span className="block h-full rounded-full bg-[#E51A24]" style={{ width: `${Math.round((b.completedCount / (b.course.totalClasses || 1)) * 100)}%` }} />
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[11.5px] font-[600] text-[#ADB5BD]">
                    {b.sched.length ? b.sched.map((s) => `${DAYS_SHORT[s.dayOfWeek]} ${s.time}`).join(' · ') : 'Schedule to be announced'}
                  </p>
                </div>
                <ArrowUpRight size={18} className="shrink-0 text-[#ADB5BD] transition-all duration-500 group-hover:rotate-45 group-hover:text-[#E51A24]" />
              </div>
            </Link>
          ))}

          {/* Certificates */}
          {ov.certificates.length > 0 && (
            <div className="rounded-[26px] bg-[#1A1A1A] p-6 text-white">
              <h3 className="flex items-center gap-2 text-[15px] font-[800]"><Award size={17} className="text-[#E51A24]" /> Certificates earned</h3>
              <div className="mt-4 space-y-2.5">
                {ov.certificates.map((c) => (
                  <Link key={c.cert.id} href={`/portal/certificates/${c.cert.id}`} className="group flex items-center justify-between rounded-2xl bg-white/[0.06] px-5 py-3.5 ring-1 ring-white/10 transition hover:bg-white/[0.1]">
                    <div className="flex items-center gap-3">
                      <BadgeCheck size={16} className="text-[#E51A24]" />
                      <span className="text-[13.5px] font-[700]">{c.course?.title}</span>
                    </div>
                    <span className="text-[11.5px] font-[600] text-white/50 group-hover:text-white">{c.cert.serial}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Updates */}
        <div>
          <NotificationFeed messages={myMessages.map((m) => ({
            id: m.id, title: m.title, body: m.body, category: m.category,
            tone: m.tone, readAt: m.readAt, createdAt: m.createdAt,
          }))} />
        </div>
      </div>
    </div>
  );
}
