import { db } from '@/db';
import { users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { updateStudent } from '@/lib/actions/admin';
import { formatDate } from '@/lib/utils';
import { ChevronDown, Save, Trash2 } from 'lucide-react';
import StudentCreate from '@/components/admin/student-create';
import { deleteStudent } from '@/lib/actions/people';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  await requireRole('management');
  const students = await db.select().from(users).where(eq(users.role, 'student')).orderBy(desc(users.id));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Directory</p>
          <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
            Students <span className="font-serif-accent font-normal italic text-[#6C757D]">({students.length}).</span>
          </h1>
        </div>
        <StudentCreate />
      </div>

      <div className="space-y-3">
        {students.map((s) => (
          <details key={s.id} className="group glass rounded-[24px] open:shadow-[0_18px_50px_rgba(26,26,26,0.1)]">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
              {s.profileImage ? (
                <img src={s.profileImage} alt="" className="h-12 w-12 rounded-2xl object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A1A1A] font-[800] text-white">{s.name[0]}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-[800] tracking-tight">{s.name}</p>
                <p className="text-[11.5px] font-[600] text-[#ADB5BD]">
                  <span className="text-[#E51A24]">{s.studentId}</span> · {s.phone ?? '—'} · {s.email}
                </p>
              </div>
              <p className="hidden text-[11.5px] font-[650] text-[#ADB5BD] sm:block">
                {s.className ? `Class ${s.className}` : 'Class —'} · joined {formatDate(s.createdAt)}
              </p>
              <ChevronDown size={16} className="text-[#ADB5BD] transition-transform duration-300 group-open:rotate-180" />
            </summary>

            <form action={updateStudent} className="border-t border-black/[0.06] p-5">
              <input type="hidden" name="id" value={s.id} />
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Name</label>
                  <input name="name" defaultValue={s.name} className="input" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input name="phone" defaultValue={s.phone ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">Class</label>
                  <input name="className" defaultValue={s.className ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">Father&apos;s name</label>
                  <input name="fatherName" defaultValue={s.fatherName ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">Mother&apos;s name</label>
                  <input name="motherName" defaultValue={s.motherName ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input name="address" defaultValue={s.address ?? ''} className="input" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button className="btn btn-dark btn-sm gap-1.5"><Save size={13} /> Save changes</button>
              </div>
            </form>
            <form action={deleteStudent} className="border-t border-black/[0.06] px-5 py-3">
              <input type="hidden" name="id" value={s.id} />
              <button className="flex items-center gap-1.5 text-[11.5px] font-[700] text-[#ADB5BD] transition hover:text-[#E51A24]">
                <Trash2 size={12} /> Remove this student
              </button>
            </form>
          </details>
        ))}
        {!students.length && <p className="glass rounded-[24px] p-10 text-center text-[13px] text-[#ADB5BD]">No registered students yet.</p>}
      </div>
    </div>
  );
}
