import { db } from '@/db';
import { batches, courses, messages, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import MessageCenter from '@/components/admin/message-center';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  await requireRole('management');

  const [students, batchRows, courseRows, recent] = await Promise.all([
    db.select({ id: users.id, name: users.name, studentId: users.studentId }).from(users).where(eq(users.role, 'student')),
    db.select().from(batches),
    db.select({ id: courses.id, title: courses.title }).from(courses),
    db.select().from(messages).orderBy(desc(messages.id)).limit(40),
  ]);

  const courseMap = new Map(courseRows.map((c) => [c.id, c.title]));
  const userMap = new Map(students.map((s) => [s.id, s.name]));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Communication</p>
        <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
          Message <span className="font-serif-accent font-normal italic text-[#6C757D]">centre.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] text-[#6C757D]">
          Students receive automatic updates for every enrollment, payment, class and certificate event.
          You can also send custom messages or declare an off day here.
        </p>
      </div>

      <MessageCenter
        recipients={students}
        batches={batchRows.map((b) => ({ id: b.id, label: `${courseMap.get(b.courseId) ?? 'Course'} — ${b.name}` }))}
        sent={recent.map((m) => ({
          id: m.id, title: m.title, body: m.body, tone: m.tone, category: m.category,
          createdAt: m.createdAt, to: m.userId ? userMap.get(m.userId) ?? 'Student' : 'Broadcast',
        }))}
      />
    </div>
  );
}
