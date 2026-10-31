import { db } from '@/db';
import { batches, bookVariants, courses, enrollments, enrollmentRequests, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { setEnrollmentStatus, setRequestStatus } from '@/lib/actions/admin';
import { formatDate } from '@/lib/utils';
import { BadgeCheck, Check, Inbox, PhoneOff, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminEnrollmentsPage() {
  await requireRole('management');
  const [ens, reqs, allBatches, allCourses, allUsers, variants] = await Promise.all([
    db.select().from(enrollments).orderBy(desc(enrollments.id)),
    db.select().from(enrollmentRequests).orderBy(desc(enrollmentRequests.id)),
    db.select().from(batches),
    db.select().from(courses),
    db.select().from(users),
    db.select().from(bookVariants),
  ]);
  const courseMap = new Map(allCourses.map((c) => [c.id, c]));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const variantMap = new Map(variants.map((v) => [v.id, v.name]));
  const pending = ens.filter((e) => e.status === 'pending');
  const decided = ens.filter((e) => e.status !== 'pending');

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Admissions</p>
        <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
          Enrollment <span className="font-serif-accent font-normal italic text-[#6C757D]">requests.</span>
        </h1>
      </div>

      {/* Pending portal enrollments */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-[17px] font-[800] tracking-tight">
          <Inbox size={17} className="text-[#E51A24]" /> Student portal requests
          {pending.length > 0 && <span className="rounded-full bg-[#E51A24] px-2.5 py-0.5 text-[10.5px] font-[800] text-white">{pending.length}</span>}
        </h2>
        <div className="space-y-3">
          {pending.map((en) => {
            const course = courseMap.get(en.courseId);
            const student = userMap.get(en.studentId);
            const cBatches = allBatches.filter((b) => b.courseId === en.courseId && b.status !== 'completed');
            return (
              <div key={en.id} className="glass flex flex-wrap items-center gap-3 rounded-[24px] p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-[800] tracking-tight">{student?.name} <span className="ml-1 text-[11px] font-[700] text-[#ADB5BD]">{student?.studentId}</span></p>
                  <p className="mt-0.5 text-[12px] font-[600] text-[#6C757D]">
                    {course?.title} · {formatDate(en.createdAt)} · {student?.phone}
                  </p>
                </div>
                <form action={setEnrollmentStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={en.id} />
                  <input type="hidden" name="status" value="confirmed" />
                  <select name="batchId" defaultValue={en.batchId ?? ''} className="input !w-44" required={cBatches.length > 0}>
                    <option value="" disabled={cBatches.length > 0}>Batch…</option>
                    {cBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <button className="btn btn-primary btn-sm gap-1"><Check size={13} /> Confirm</button>
                </form>
                <form action={setEnrollmentStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={en.id} />
                  <input type="hidden" name="status" value="verified" />
                  <button className="btn btn-dark btn-sm gap-1" title="Notify: verified, come to office for installment">
                    <BadgeCheck size={13} /> Verify
                  </button>
                </form>
                <form action={setEnrollmentStatus}>
                  <input type="hidden" name="id" value={en.id} />
                  <input type="hidden" name="status" value="no_answer" />
                  <button className="btn btn-outline btn-sm gap-1" title="Notify: we tried calling you"><PhoneOff size={13} /> No answer</button>
                </form>
                <form action={setEnrollmentStatus} className="flex items-center gap-1.5">
                  <input type="hidden" name="id" value={en.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <input name="reason" className="input !w-36 !py-1.5 text-xs" placeholder="Reason (optional)" />
                  <button className="btn btn-outline btn-sm gap-1 !border-red-200 !text-[#E51A24]"><X size={13} /> Fail</button>
                </form>
              </div>
            );
          })}
          {!pending.length && <p className="glass rounded-[24px] p-8 text-center text-[13px] text-[#ADB5BD]">No pending portal enrollments.</p>}
        </div>

        {decided.length > 0 && (
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {decided.map((en) => (
              <div key={en.id} className="flex items-center justify-between rounded-2xl bg-white px-5 py-3.5 ring-1 ring-black/[0.05]">
                <div>
                  <p className="text-[13px] font-[750]">{userMap.get(en.studentId)?.name}</p>
                  <p className="text-[11px] font-[600] text-[#ADB5BD]">
                    {courseMap.get(en.courseId)?.title}{en.batchId ? ` · ${allBatches.find((b) => b.id === en.batchId)?.name}` : ''}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10.5px] font-[750] capitalize ${
                  en.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>{en.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Public website requests */}
      <section>
        <h2 className="mb-4 text-[17px] font-[800] tracking-tight">Website form requests</h2>
        <div className="grid gap-3">
          {reqs.map((r) => (
            <div key={r.id} className="glass rounded-[24px] p-5">
              <div className="flex flex-wrap items-start gap-5">
                {r.profileImage ? (
                  <img src={r.profileImage} alt="" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-black/10" />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A1A1A] text-lg font-[800] text-white">{r.fullName[0]}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="text-[15px] font-[800] tracking-tight">{r.fullName}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-[750] capitalize ${
                      r.status === 'new' ? 'bg-sky-100 text-sky-700' : r.status === 'contacted' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                    }`}>{r.status}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] font-[650] text-[#E51A24]">{courseMap.get(r.courseId)?.title}</p>
                  <div className="mt-2 grid gap-x-8 gap-y-1 text-[12px] font-[600] text-[#6C757D] sm:grid-cols-2">
                    <p>Mobile: {r.mobile}{r.whatsapp ? ` · WA: ${r.whatsapp}` : ''}</p>
                    {r.className && <p>Class: {r.className}</p>}
                    {r.email && <p>Email: {r.email}</p>}
                    {r.address && <p>Address: {r.address}</p>}
                    {r.fatherName && <p>Father: {r.fatherName}</p>}
                    {r.motherName && <p>Mother: {r.motherName}</p>}
                    <p className="font-[750] text-[#1A1A1A]">
                      Book: {r.includeBook ? (variantMap.get(r.bookVariantId ?? -1) ?? 'Standard book') : 'Not included'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['new', 'contacted', 'closed'] as const).map((s) => (
                    <form key={s} action={setRequestStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value={s} />
                      <button className={`btn btn-sm ${r.status === s ? 'btn-dark' : 'btn-outline'} capitalize`}>{s}</button>
                    </form>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {!reqs.length && <p className="glass rounded-[24px] p-8 text-center text-[13px] text-[#ADB5BD]">No website requests yet.</p>}
        </div>
      </section>
    </div>
  );
}
