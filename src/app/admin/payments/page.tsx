import Link from 'next/link';
import { db } from '@/db';
import { courses, enrollments, payments, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { deletePayment } from '@/lib/actions/admin';
import { effectiveFee, formatDate, tk } from '@/lib/utils';
import RecordPayment from '@/components/admin/record-payment';
import { CreditCard, Printer, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  await requireRole('management');
  const confirmed = await db.select().from(enrollments).where(eq(enrollments.status, 'confirmed')).orderBy(desc(enrollments.id));

  const rows = await Promise.all(
    confirmed.map(async (en) => {
      const student = (await db.select().from(users).where(eq(users.id, en.studentId)).limit(1))[0];
      const course = (await db.select().from(courses).where(eq(courses.id, en.courseId)).limit(1))[0];
      const pays = await db.select().from(payments).where(eq(payments.enrollmentId, en.id)).orderBy(desc(payments.id));
      const total = course ? effectiveFee(course) + course.bookFee : 0;
      const paidSum = pays.reduce((s, p) => s + p.amount, 0);
      return { en, student, course, pays, total, paidSum, outstanding: Math.max(0, total - paidSum) };
    }),
  );

  const totalCollected = rows.reduce((s, r) => s + r.paidSum, 0);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Finance</p>
        <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
          Payments & <span className="font-serif-accent font-normal italic text-[#6C757D]">balances.</span>
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-[24px] p-6">
          <p className="text-[11px] font-[750] uppercase tracking-[0.14em] text-[#ADB5BD]">Collected</p>
          <p className="mt-2 text-[26px] font-[800] tracking-tight text-emerald-600">{tk(totalCollected)}</p>
        </div>
        <div className="glass rounded-[24px] p-6">
          <p className="text-[11px] font-[750] uppercase tracking-[0.14em] text-[#ADB5BD]">Outstanding</p>
          <p className="mt-2 text-[26px] font-[800] tracking-tight text-[#E51A24]">{tk(totalOutstanding)}</p>
        </div>
        <div className="glass flex flex-col justify-center rounded-[24px] p-6">
          <p className="flex items-center gap-2 text-[12.5px] font-[750] text-[#1A1A1A]"><CreditCard size={15} className="text-[#ADB5BD]" /> Online payment not available</p>
          <p className="mt-1 text-[11.5px] font-[600] text-[#ADB5BD]">Coming soon — currently office payments only.</p>
        </div>
      </div>

      <div className="space-y-5">
        {rows.map((r) => (
          <div key={r.en.id} className="overflow-hidden rounded-[26px] bg-white ring-1 ring-black/[0.05]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.05] px-7 py-5">
              <div>
                <p className="text-[14.5px] font-[800] tracking-tight">{r.student?.name} <span className="ml-1 text-[11px] font-[700] text-[#ADB5BD]">{r.student?.studentId}</span></p>
                <p className="text-[12px] font-[600] text-[#6C757D]">{r.course?.title}</p>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex gap-5 text-right text-[12.5px] font-[750]">
                  <div><p className="text-[10px] uppercase tracking-[0.12em] text-[#ADB5BD]">Total</p><p>{tk(r.total)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-[0.12em] text-[#ADB5BD]">Paid</p><p className="text-emerald-600">{tk(r.paidSum)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-[0.12em] text-[#ADB5BD]">Due</p><p className={r.outstanding > 0 ? 'text-[#E51A24]' : 'text-emerald-600'}>{tk(r.outstanding)}</p></div>
                </div>
                <RecordPayment enrollmentId={r.en.id} outstanding={r.outstanding} />
              </div>
            </div>
            {r.pays.length > 0 && (
              <div>
                {r.pays.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.04] px-7 py-3.5 last:border-0">
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] font-[800] text-emerald-600">{tk(p.amount)}</span>
                      <span className="text-[11.5px] font-[600] text-[#ADB5BD]">{formatDate(p.createdAt)} · {p.note || 'Office payment'} · by {r.pays[0]?.receivedBy ?? 'office'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/portal/receipts/${p.id}`} className="btn btn-outline btn-sm gap-1.5"><Printer size={12} /> Receipt</Link>
                      <form action={deletePayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[#CED4DA] transition hover:bg-red-50 hover:text-[#E51A24]"><Trash2 size={13} /></button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {!rows.length && <p className="glass rounded-[24px] p-10 text-center text-[13px] text-[#ADB5BD]">No confirmed enrollments yet.</p>}
      </div>
    </div>
  );
}
