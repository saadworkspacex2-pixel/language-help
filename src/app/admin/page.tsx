import Link from 'next/link';
import { db } from '@/db';
import {
  certificates, courses, enrollments, enrollmentRequests, payments, users, batches, bookOrders,
} from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { effectiveFee, formatDate, tk } from '@/lib/utils';
import DashboardCharts, { type ChartData } from '@/components/admin/dashboard-charts';
import {
  ArrowRight, Award, BookOpen, CreditCard, GraduationCap, Inbox, Users, Wallet,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function monthKey(d: Date) {
  return d.toLocaleDateString('en-GB', { month: 'short' });
}

export default async function AdminDashboard() {
  const user = await requireRole('management');

  const [studentRows, teacherRows, courseRows, allEnrollments, pendingReq, certRows, allPayments, bookOrderRows, allBatches] =
    await Promise.all([
      db.select({ id: users.id, createdAt: users.createdAt }).from(users).where(eq(users.role, 'student')),
      db.select({ id: users.id }).from(users).where(eq(users.role, 'teacher')),
      db.select().from(courses),
      db.select().from(enrollments).orderBy(desc(enrollments.id)),
      db.select().from(enrollmentRequests).where(eq(enrollmentRequests.status, 'new')).orderBy(desc(enrollmentRequests.id)),
      db.select({ id: certificates.id, enrollmentId: certificates.enrollmentId }).from(certificates),
      db.select().from(payments),
      db.select({ amount: bookOrders.amount, status: bookOrders.status }).from(bookOrders),
      db.select().from(batches),
    ]);

  const courseMap = new Map(courseRows.map((c) => [c.id, c]));
  const pendingEn = allEnrollments.filter((e) => e.status === 'pending');
  const confirmedEn = allEnrollments.filter((e) => e.status === 'confirmed');

  // Outstanding
  let outstanding = 0;
  for (const en of confirmedEn) {
    const course = courseMap.get(en.courseId);
    if (!course) continue;
    const paid = allPayments.filter((p) => p.enrollmentId === en.id).reduce((s, p) => s + p.amount, 0);
    outstanding += Math.max(0, effectiveFee(course) + course.bookFee - paid);
  }
  const collected = allPayments.reduce((s, p) => s + p.amount, 0);
  const bookRevenue = bookOrderRows.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.amount, 0);

  // --- Charts ---
  const months: { key: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const start = new Date(d);
    const end = new Date(d);
    end.setMonth(end.getMonth() + 1);
    months.push({ key: monthKey(d), start, end });
  }

  const revenue = months.map((m) => {
    const inMonth = allPayments.filter((p) => p.createdAt >= m.start && p.createdAt < m.end);
    const total = inMonth.reduce((s, p) => s + p.amount, 0);
    return { month: m.key, revenue: total, collected: total };
  });

  const popularity = courseRows
    .map((c) => ({ name: c.title.length > 16 ? c.title.slice(0, 15) + '…' : c.title, students: confirmedEn.filter((e) => e.courseId === c.id).length }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 6);

  const certEnrollmentIds = new Set(certRows.map((c) => c.enrollmentId));
  const retention = months.map((m) => {
    const started = confirmedEn.filter((e) => e.createdAt < m.end);
    const completed = started.filter((e) => certEnrollmentIds.has(e.id));
    const active = started.length - completed.length;
    return {
      month: m.key,
      active,
      completed: completed.length,
      retention: started.length ? Math.round((active / started.length) * 100) : 0,
    };
  });

  const statusMix = [
    { name: 'Confirmed', value: confirmedEn.length },
    { name: 'Pending', value: pendingEn.length },
    { name: 'Rejected', value: allEnrollments.filter((e) => e.status === 'rejected').length },
    { name: 'Web requests', value: pendingReq.length },
  ].filter((s) => s.value > 0);

  const chartData: ChartData = { revenue, popularity, retention, statusMix };

  const stats = [
    { icon: GraduationCap, l: 'Students', v: String(studentRows.length) },
    { icon: Users, l: 'Teachers', v: String(teacherRows.length) },
    { icon: BookOpen, l: 'Active courses', v: String(courseRows.filter((c) => c.active).length) },
    { icon: Inbox, l: 'Pending enrollments', v: String(pendingEn.length), warn: pendingEn.length > 0 },
    { icon: CreditCard, l: 'Fees collected', v: tk(collected) },
    { icon: Wallet, l: 'Outstanding', v: tk(outstanding), warn: outstanding > 0 },
    { icon: BookOpen, l: 'Book sales', v: tk(bookRevenue) },
    { icon: Award, l: 'Certificates issued', v: String(certRows.length) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">{formatDate(new Date())}</p>
        <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
          Business <span className="font-serif-accent font-normal italic text-[#6C757D]">intelligence.</span>
        </h1>
        <p className="mt-2 text-[13.5px] text-[#6C757D]">Welcome back, {user.name}. Here is how Language Help BD is performing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="glass card-hover rounded-[24px] p-5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${s.warn ? 'bg-[#E51A24]' : 'bg-[#1A1A1A]'} text-white`}>
              <s.icon size={16} />
            </span>
            <p className="mt-3.5 text-[22px] font-[800] tracking-tight text-[#1A1A1A]">{s.v}</p>
            <p className="text-[11.5px] font-[650] text-[#6C757D]">{s.l}</p>
          </div>
        ))}
      </div>

      <DashboardCharts data={chartData} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[26px] bg-white p-6 ring-1 ring-black/[0.05]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15.5px] font-[800] tracking-tight">Pending enrollments</h2>
            <Link href="/admin/enrollments" className="btn btn-outline btn-sm gap-1.5">Manage <ArrowRight size={13} /></Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {pendingEn.slice(0, 5).map((en) => (
              <div key={en.id} className="flex items-center justify-between rounded-2xl bg-[#F8F9FA] px-4 py-3">
                <EnrollmentLine studentId={en.studentId} courseId={en.courseId} />
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-[750] text-amber-700">pending</span>
              </div>
            ))}
            {!pendingEn.length && <p className="py-6 text-center text-[12.5px] text-[#ADB5BD]">All caught up.</p>}
          </div>
        </div>

        <div className="rounded-[26px] bg-white p-6 ring-1 ring-black/[0.05]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15.5px] font-[800] tracking-tight">New website requests</h2>
            <Link href="/admin/enrollments" className="btn btn-outline btn-sm gap-1.5">View all <ArrowRight size={13} /></Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {pendingReq.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl bg-[#F8F9FA] px-4 py-3">
                <div>
                  <p className="text-[13px] font-[750]">{r.fullName}</p>
                  <p className="text-[11px] font-[600] text-[#ADB5BD]">{r.mobile} · {formatDate(r.createdAt)}</p>
                </div>
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-[750] text-sky-700">new</span>
              </div>
            ))}
            {!pendingReq.length && <p className="py-6 text-center text-[12.5px] text-[#ADB5BD]">No new requests.</p>}
          </div>
        </div>
      </div>
      <p className="pb-2 text-center text-[11px] font-[600] text-[#ADB5BD]">{allBatches.length} batches running across {courseRows.length} courses</p>
    </div>
  );
}

async function EnrollmentLine({ studentId, courseId }: { studentId: number; courseId: number }) {
  const [u, c] = await Promise.all([
    db.select({ name: users.name, studentId: users.studentId }).from(users).where(eq(users.id, studentId)).limit(1),
    db.select({ title: courses.title }).from(courses).where(eq(courses.id, courseId)).limit(1),
  ]);
  void sql;
  return (
    <div>
      <p className="text-[13px] font-[750]">{u[0]?.name ?? '—'}</p>
      <p className="text-[11px] font-[600] text-[#ADB5BD]">{u[0]?.studentId} → {c[0]?.title}</p>
    </div>
  );
}
