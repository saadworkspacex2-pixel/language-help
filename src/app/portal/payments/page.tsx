import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { getEnrollmentBundles } from '@/lib/student-data';
import { formatDate, tk } from '@/lib/utils';
import { CreditCard, Printer, Wallet } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const user = await requireRole('student');
  const bundles = await getEnrollmentBundles(user.id);
  const confirmed = bundles.filter((b) => b.enrollment.status === 'confirmed');
  const totalOut = confirmed.reduce((s, b) => s + b.outstanding, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Payments</p>
        <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
          Fees & <span className="font-serif-accent font-normal italic text-[#6C757D]">receipts.</span>
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass rounded-[26px] p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E51A24] text-white"><Wallet size={18} /></span>
          <p className="mt-4 text-[26px] font-[800] tracking-tight text-[#1A1A1A]">{tk(totalOut)}</p>
          <p className="text-[12px] font-[650] text-[#6C757D]">Total outstanding — payable at the office</p>
        </div>
        <div className="glass flex flex-col justify-center rounded-[26px] p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1A1A1A] text-white"><CreditCard size={18} /></span>
          <p className="mt-4 text-[14px] font-[750] tracking-tight text-[#1A1A1A]">Online payment is not available right now</p>
          <p className="text-[12px] font-[600] text-[#ADB5BD]">Coming soon — until then, pay at the office counter.</p>
        </div>
      </div>

      {confirmed.map((b) => (
        <div key={b.enrollment.id} className="overflow-hidden rounded-[28px] bg-white ring-1 ring-black/[0.05]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.05] px-7 py-5">
            <div>
              <p className="text-[15.5px] font-[800] tracking-tight text-[#1A1A1A]">{b.course?.title}</p>
              <p className="text-[12px] font-[600] text-[#ADB5BD]">{b.batch?.name ?? 'Batch TBA'}</p>
            </div>
            <div className="flex items-center gap-6 text-right text-[13px] font-[700]">
              <div><p className="text-[10.5px] uppercase tracking-[0.12em] text-[#ADB5BD]">Total</p><p>{tk(b.total)}</p></div>
              <div><p className="text-[10.5px] uppercase tracking-[0.12em] text-[#ADB5BD]">Paid</p><p className="text-emerald-600">{tk(b.paidSum)}</p></div>
              <div><p className="text-[10.5px] uppercase tracking-[0.12em] text-[#ADB5BD]">Due</p><p className={b.outstanding > 0 ? 'text-[#E51A24]' : 'text-emerald-600'}>{tk(b.outstanding)}</p></div>
            </div>
          </div>
          <div>
            {b.paid.length === 0 && <p className="px-7 py-6 text-[13px] text-[#ADB5BD]">No payments recorded yet.</p>}
            {b.paid.map((p, i) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.04] px-7 py-4 last:border-0">
                <div className="flex items-center gap-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F3F5] text-[12px] font-[800] text-[#6C757D]">{i + 1}</span>
                  <div>
                    <p className="text-[13.5px] font-[750] text-[#1A1A1A]">{tk(p.amount)}</p>
                    <p className="text-[11.5px] font-[600] text-[#ADB5BD]">{formatDate(p.createdAt)} · {p.note || 'Office payment'}</p>
                  </div>
                </div>
                <Link href={`/portal/receipts/${p.id}`} className="btn btn-outline btn-sm gap-1.5">
                  <Printer size={13} /> Receipt
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!confirmed.length && (
        <p className="glass rounded-[26px] p-10 text-center text-[13.5px] text-[#6C757D]">
          Payment information appears after your enrollment is confirmed.
        </p>
      )}
    </div>
  );
}
