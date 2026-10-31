import { notFound, redirect } from 'next/navigation';
import { db } from '@/db';
import { courses, enrollments, payments, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/session';
import { effectiveFee, formatDate, tk } from '@/lib/utils';
import PrintButton from '@/components/dash/print-button';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { id } = await params;
  const p = (await db.select().from(payments).where(eq(payments.id, Number(id))).limit(1))[0];
  if (!p) notFound();
  const en = (await db.select().from(enrollments).where(eq(enrollments.id, p.enrollmentId)).limit(1))[0];
  if (!en) notFound();
  if (user.role === 'student' && en.studentId !== user.id) notFound();
  const student = (await db.select().from(users).where(eq(users.id, en.studentId)).limit(1))[0];
  const course = (await db.select().from(courses).where(eq(courses.id, en.courseId)).limit(1))[0];

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-8">
      <div className="print-full glass-strong w-full max-w-lg rounded-[30px] p-9">
        <div className="flex items-center justify-between border-b-2 border-dashed border-black/10 pb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E51A24] text-base font-[800] text-white">L</span>
            <div>
              <p className="text-[15px] font-[800] tracking-tight">Language Help BD</p>
              <p className="text-[10.5px] font-[650] uppercase tracking-[0.16em] text-[#ADB5BD]">Payment Receipt</p>
            </div>
          </div>
          <p className="text-right text-[11px] font-[650] leading-relaxed text-[#ADB5BD]">
            Receipt #{String(p.id).padStart(5, '0')}<br />{formatDate(p.createdAt)}
          </p>
        </div>

        <div className="space-y-3.5 py-7 text-[13.5px] font-[650]">
          <div className="flex justify-between"><span className="text-[#6C757D]">Student</span><span>{student?.name}</span></div>
          <div className="flex justify-between"><span className="text-[#6C757D]">Student ID</span><span>{student?.studentId}</span></div>
          <div className="flex justify-between"><span className="text-[#6C757D]">Course</span><span>{course?.title}</span></div>
          <div className="flex justify-between"><span className="text-[#6C757D]">Note</span><span>{p.note || 'Office payment'}</span></div>
          <div className="flex justify-between"><span className="text-[#6C757D]">Received by</span><span>{p.receivedBy ?? 'LHBD Office'}</span></div>
          <div className="flex justify-between border-t border-dashed border-black/10 pt-4 text-[20px] font-[800]">
            <span>Amount</span><span className="text-[#E51A24]">{tk(p.amount)}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-[#ADB5BD]">Course total incl. book</span>
            <span className="text-[#ADB5BD]">{tk(course ? effectiveFee(course) + course.bookFee : 0)}</span>
          </div>
        </div>

        <p className="rounded-2xl bg-[#F8F9FA] px-4 py-3 text-center text-[11px] font-[600] text-[#ADB5BD]">
          Thank you for learning with Language Help BD · {student?.studentId}
        </p>
      </div>
      <div className="no-print mt-6 flex gap-3">
        <PrintButton />
      </div>
    </div>
  );
}
