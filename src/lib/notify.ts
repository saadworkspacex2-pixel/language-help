import { db } from '@/db';
import { messages, enrollments, users, courses, batches, classSessions } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

export type Tone = 'info' | 'success' | 'warning' | 'danger';
export type Category = 'enrollment' | 'class' | 'payment' | 'notice' | 'certificate' | 'update';

export type NotifyInput = {
  userId: number | null;
  title: string;
  body: string;
  category?: Category;
  tone?: Tone;
  actionUrl?: string | null;
};

/** Deliver a message to a student's portal (and future SMS/WhatsApp channels). */
export async function notify(input: NotifyInput) {
  await db.insert(messages).values({
    userId: input.userId,
    title: input.title,
    body: input.body,
    category: input.category ?? 'update',
    tone: input.tone ?? 'info',
    actionUrl: input.actionUrl ?? null,
  });
}

export async function notifyMany(userIds: number[], input: Omit<NotifyInput, 'userId'>) {
  if (!userIds.length) return;
  await db.insert(messages).values(
    userIds.map((userId) => ({
      userId,
      title: input.title,
      body: input.body,
      category: input.category ?? 'update',
      tone: input.tone ?? 'info',
      actionUrl: input.actionUrl ?? null,
    })),
  );
}

const money = (n: number) => '৳' + n.toLocaleString('en-IN');
const nice = (d: string | Date | null) => {
  if (!d) return 'soon';
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};

/**
 * Autonomous templates — every lifecycle event produces the right student message.
 */
export const TEMPLATES = {
  enrollmentReceived: (course: string) => ({
    title: 'Enrollment request received',
    body: `We have received your enrollment request for ${course}. Our management team is reviewing it and will contact you shortly.`,
    category: 'enrollment' as Category, tone: 'info' as Tone,
  }),
  enrollmentVerified: (course: string, due: number) => ({
    title: 'Your order is verified by the Management',
    body: `Your enrollment for ${course} is verified by the Management. You will soon be called, and you have to give the installment by coming at the office. Total payable: ${money(due)} (course fee + book).`,
    category: 'enrollment' as Category, tone: 'success' as Tone,
  }),
  enrollmentConfirmed: (course: string, batch: string | null, start: string | null) => ({
    title: 'Enrollment confirmed — welcome aboard!',
    body: `Congratulations! Your seat in ${course}${batch ? ` (${batch})` : ''} is confirmed. ${start ? `Classes start on ${nice(start)}.` : 'Your class schedule will be shared shortly.'} The course is now available in your portal.`,
    category: 'enrollment' as Category, tone: 'success' as Tone,
  }),
  enrollmentCalledNoAnswer: (course: string) => ({
    title: 'We tried to call you',
    body: `We tried calling you about your ${course} enrollment but could not reach you. Please call us back or reply on WhatsApp so we can confirm your seat.`,
    category: 'enrollment' as Category, tone: 'warning' as Tone,
  }),
  enrollmentFailed: (course: string, reason?: string) => ({
    title: 'Enrollment could not be processed',
    body: `Unfortunately your enrollment request for ${course} could not be completed.${reason ? ` Reason: ${reason}.` : ''} Please contact the office if you believe this is a mistake — we are happy to help.`,
    category: 'enrollment' as Category, tone: 'danger' as Tone,
  }),
  paymentReceived: (amount: number, course: string, outstanding: number) => ({
    title: `Payment received — ${money(amount)}`,
    body: `We have received your payment of ${money(amount)} for ${course}. ${outstanding > 0 ? `Remaining balance: ${money(outstanding)}. You can pay the rest at the office anytime.` : 'Your fees are fully paid. Thank you!'}`,
    category: 'payment' as Category, tone: outstanding > 0 ? ('info' as Tone) : ('success' as Tone),
  }),
  paymentDue: (course: string, outstanding: number) => ({
    title: 'Installment reminder',
    body: `A friendly reminder that ${money(outstanding)} is still outstanding for ${course}. Please visit the office to pay your next installment.`,
    category: 'payment' as Category, tone: 'warning' as Tone,
  }),
  classCompleted: (course: string, n: number, total: number, next: string | null) => ({
    title: `Class ${n} completed`,
    body: `Class ${n} of ${total} for ${course} is done. ${next ? `Your next class is on ${nice(next)}.` : 'The course schedule is complete.'}`,
    category: 'class' as Category, tone: 'info' as Tone,
  }),
  classPostponed: (course: string, n: number, from: string, to: string) => ({
    title: `Class ${n} moved to a new date`,
    body: `${course}: Class ${n} scheduled on ${nice(from)} has been postponed to ${nice(to)}. Your class number stays the same — no class is skipped.`,
    category: 'class' as Category, tone: 'warning' as Tone,
  }),
  offDay: (date: string, reason: string) => ({
    title: 'Institution closed — off day',
    body: `Language Help BD will remain closed on ${nice(date)}${reason ? ` (${reason})` : ''}. Affected classes are rescheduled automatically and your class numbers continue correctly.`,
    category: 'class' as Category, tone: 'warning' as Tone,
  }),
  routine: (course: string, days: string, time: string) => ({
    title: 'Your class routine',
    body: `${course} runs on ${days} at ${time}. You can always see your full schedule and attendance in the portal.`,
    category: 'class' as Category, tone: 'info' as Tone,
  }),
  certificateReady: (course: string) => ({
    title: 'Your Certificate of Completion is ready 🎓',
    body: `You have completed every class of ${course}. Your Certificate of Completion is now available in your portal — you can view and print it anytime.`,
    category: 'certificate' as Category, tone: 'success' as Tone,
  }),
  bookOrder: (book: string, variant: string, amount: number) => ({
    title: 'Book order received',
    body: `Your order for “${book}” (${variant}) totalling ${money(amount)} has been received. Management will contact you to arrange collection or delivery.`,
    category: 'update' as Category, tone: 'info' as Tone,
  }),
};

/** Send a notice to every student (or teachers) as a portal message. */
export async function broadcastNotice(title: string, body: string, audience: string) {
  const roles = audience === 'teachers' ? ['teacher'] : audience === 'students' ? ['student'] : ['student', 'teacher'];
  const recipients = await db.select({ id: users.id }).from(users).where(inArray(users.role, roles));
  await notifyMany(recipients.map((r) => r.id), {
    title, body: body || title, category: 'notice', tone: 'info', actionUrl: '/portal',
  });
}

/** Everyone confirmed in a batch. */
export async function batchStudentIds(batchId: number): Promise<number[]> {
  const rows = await db
    .select({ id: enrollments.studentId })
    .from(enrollments)
    .where(and(eq(enrollments.batchId, batchId), eq(enrollments.status, 'confirmed')));
  return rows.map((r) => r.id);
}

/** Helper: resolve display context for an enrollment. */
export async function enrollmentContext(enrollmentId: number) {
  const en = (await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId)).limit(1))[0];
  if (!en) return null;
  const course = (await db.select().from(courses).where(eq(courses.id, en.courseId)).limit(1))[0] ?? null;
  const batch = en.batchId ? (await db.select().from(batches).where(eq(batches.id, en.batchId)).limit(1))[0] ?? null : null;
  const next = batch
    ? (await db.select().from(classSessions).where(and(eq(classSessions.batchId, batch.id), eq(classSessions.status, 'scheduled'))).orderBy(classSessions.date).limit(1))[0] ?? null
    : null;
  return { en, course, batch, next };
}
