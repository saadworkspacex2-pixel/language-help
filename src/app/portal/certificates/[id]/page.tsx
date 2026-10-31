import { notFound, redirect } from 'next/navigation';
import { db } from '@/db';
import { certificates, courses, enrollments, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/session';
import { formatDate } from '@/lib/utils';
import PrintButton from '@/components/dash/print-button';

export const dynamic = 'force-dynamic';

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { id } = await params;
  const cert = (await db.select().from(certificates).where(eq(certificates.id, Number(id))).limit(1))[0];
  if (!cert) notFound();
  const en = (await db.select().from(enrollments).where(eq(enrollments.id, cert.enrollmentId)).limit(1))[0];
  if (!en) notFound();
  if (user.role === 'student' && en.studentId !== user.id) notFound();
  const student = (await db.select().from(users).where(eq(users.id, en.studentId)).limit(1))[0];
  const course = (await db.select().from(courses).where(eq(courses.id, en.courseId)).limit(1))[0];

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center py-8">
      <div className="print-full relative w-full max-w-3xl overflow-hidden rounded-[30px] bg-white p-1.5 shadow-[0_24px_70px_rgba(26,26,26,0.14)]">
        <div className="relative overflow-hidden rounded-[26px] border border-black/[0.08] px-10 py-14 text-center md:px-16">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#E51A24] opacity-[0.06] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-[#E51A24] opacity-[0.06] blur-3xl" />

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#E51A24] text-lg font-[800] text-white shadow-[0_12px_28px_rgba(229,26,36,0.35)]">L</div>
          <p className="mt-4 text-[11px] font-[800] uppercase tracking-[0.3em] text-[#ADB5BD]">Language Help BD</p>
          <h1 className="font-serif-accent mt-6 text-[34px] italic leading-tight tracking-normal text-[#1A1A1A]">Certificate of Completion</h1>

          <p className="mt-8 text-[12px] font-[650] uppercase tracking-[0.2em] text-[#ADB5BD]">This is proudly presented to</p>
          <p className="mt-3 text-[30px] font-[800] tracking-tight text-[#1A1A1A]">{student?.name}</p>
          <div className="mx-auto mt-3 h-px w-44 bg-black/10" />

          <p className="mx-auto mt-6 max-w-md text-[14px] leading-relaxed text-[#6C757D]">
            for successfully completing all {course?.totalClasses} classes of the
            <span className="font-[750] text-[#1A1A1A]"> {course?.title} </span>
            program at Language Help BD.
          </p>

          <div className="mt-12 flex items-end justify-between text-left">
            <div>
              <p className="text-[10.5px] font-[700] uppercase tracking-[0.16em] text-[#ADB5BD]">Certificate No.</p>
              <p className="mt-1 text-[12.5px] font-[750] text-[#1A1A1A]">{cert.serial}</p>
              <p className="mt-2 text-[10.5px] font-[700] uppercase tracking-[0.16em] text-[#ADB5BD]">Issued</p>
              <p className="mt-1 text-[12.5px] font-[750] text-[#1A1A1A]">{formatDate(cert.issuedAt)}</p>
            </div>
            <div className="text-right">
              <p className="font-serif-accent text-[22px] italic text-[#1A1A1A]">LHBD</p>
              <div className="mt-1 h-px w-36 bg-[#1A1A1A]" />
              <p className="mt-1.5 text-[10.5px] font-[700] uppercase tracking-[0.16em] text-[#ADB5BD]">Founder, LHBD</p>
            </div>
          </div>
        </div>
      </div>
      <div className="no-print mt-6"><PrintButton label="Print certificate" /></div>
    </div>
  );
}
