import Link from 'next/link';
import { db } from '@/db';
import { courses, users } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { effectiveFee, tk } from '@/lib/utils';
import { toggleCourseActive } from '@/lib/actions/admin';
import { Pencil, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  await requireRole('management');
  const [all, people] = await Promise.all([
    db.select().from(courses).orderBy(desc(courses.id)),
    db.select().from(users),
  ]);
  const teacherMap = new Map(people.map((p) => [p.id, p.name]));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Manage</p>
          <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
            Courses & <span className="font-serif-accent font-normal italic text-[#6C757D]">batches.</span>
          </h1>
        </div>
        <Link href="/admin/courses/edit/new" className="btn btn-primary btn-md gap-2"><Plus size={15} /> New course</Link>
      </div>

      <div className="grid gap-4">
        {all.map((c) => (
          <div key={c.id} className="glass card-hover flex flex-wrap items-center gap-5 rounded-[24px] p-5">
            <img src={c.banner ?? ''} alt="" className="h-16 w-24 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-[15px] font-[800] tracking-tight">{c.title}</p>
                {!c.active && <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-[10px] font-[750] text-gray-500">hidden</span>}
              </div>
              <p className="mt-0.5 text-[12px] font-[600] text-[#ADB5BD]">
                {c.teacherId ? teacherMap.get(c.teacherId) ?? 'No mentor' : 'No mentor'} · {c.totalClasses} classes · book {tk(c.bookFee)}
              </p>
              <p className="mt-1 text-[13px] font-[800] text-[#E51A24]">
                {tk(effectiveFee(c))}{c.offerFee ? <span className="ml-2 text-[11px] font-[600] text-[#ADB5BD] line-through">{tk(c.fee)}</span> : null}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <form action={toggleCourseActive}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="active" value={c.active ? '0' : '1'} />
                <button className="btn btn-outline btn-sm">{c.active ? 'Hide' : 'Publish'}</button>
              </form>
              <Link href={`/admin/courses/edit/${c.id}`} className="btn btn-dark btn-sm gap-1.5"><Pencil size={13} /> Edit</Link>
            </div>
          </div>
        ))}
        {!all.length && <p className="glass rounded-[24px] p-10 text-center text-[13px] text-[#ADB5BD]">No courses yet — create your first one.</p>}
      </div>
    </div>
  );
}
