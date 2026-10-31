'use server';

import { db } from '@/db';
import { users, classSessions, batches, courses, messages } from '@/db/schema';
import { and, eq, gte, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { hashPassword } from '@/lib/password';
import { saveUpload } from '@/lib/upload';
import { genStudentId } from '@/lib/utils';
import { notify, notifyMany, batchStudentIds, TEMPLATES } from '@/lib/notify';
import { revalidatePath } from 'next/cache';

const refresh = () => revalidatePath('/', 'layout');

/** Management manually creates an official student profile. */
export async function createStudent(prev: unknown, formData: FormData) {
  await requireRole('management');
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '').trim();
  if (!name || !email) return { ok: false, error: 'Name and email are required.' };
  if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

  const dup = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (dup.length) return { ok: false, error: 'A user with this email already exists.' };

  let studentId = String(formData.get('studentId') || '').trim() || genStudentId();
  for (let i = 0; i < 10; i++) {
    const clash = await db.select({ id: users.id }).from(users).where(eq(users.studentId, studentId)).limit(1);
    if (!clash.length) break;
    studentId = genStudentId();
  }

  const photo = formData.get('photo') as File | null;
  const profileImage = await saveUpload(photo, 'student');

  const inserted = await db.insert(users).values({
    role: 'student', name, email, studentId,
    passwordHash: hashPassword(password),
    phone: String(formData.get('phone') || ''),
    whatsapp: String(formData.get('whatsapp') || ''),
    className: String(formData.get('className') || ''),
    fatherName: String(formData.get('fatherName') || ''),
    motherName: String(formData.get('motherName') || ''),
    address: String(formData.get('address') || ''),
    age: Number(formData.get('age') || 0) || null,
    showOnSite: false,
    ...(profileImage ? { profileImage } : {}),
  }).returning({ id: users.id });

  await notify({
    userId: inserted[0].id,
    title: 'Welcome to Language Help BD 🎉',
    body: `Your official student profile has been created by the management. Your Student ID is ${studentId}. You can now log in with your email and enroll in courses from the portal.`,
    category: 'update', tone: 'success', actionUrl: '/portal',
  });

  refresh();
  return { ok: true, studentId };
}

export async function deleteStudent(formData: FormData) {
  await requireRole('management');
  const id = Number(formData.get('id'));
  await db.delete(messages).where(eq(messages.userId, id));
  await db.delete(users).where(eq(users.id, id));
  refresh();
}

/** Management sends a custom message to one student or everyone. */
export async function sendMessage(prev: unknown, formData: FormData) {
  await requireRole('management');
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const target = String(formData.get('target') || 'all');
  const tone = String(formData.get('tone') || 'info');
  if (!title || !body) return { ok: false, error: 'Title and message are required.' };

  if (target === 'all' || target === 'students' || target === 'teachers') {
    const roles = target === 'teachers' ? ['teacher'] : target === 'students' ? ['student'] : ['student', 'teacher'];
    const recipients = await db.select({ id: users.id }).from(users).where(inArray(users.role, roles));
    await notifyMany(recipients.map((r) => r.id), { title, body, category: 'update', tone: tone as 'info', actionUrl: '/portal' });
  } else {
    await notify({ userId: Number(target), title, body, category: 'update', tone: tone as 'info', actionUrl: '/portal' });
  }
  refresh();
  return { ok: true };
}

/**
 * Declare an off day: every class on that date (institution-wide or one batch)
 * shifts to the next available date, preserving class numbers.
 */
export async function declareOffDay(prev: unknown, formData: FormData) {
  await requireRole('management');
  const date = String(formData.get('date') || '');
  const reason = String(formData.get('reason') || '');
  const scope = String(formData.get('scope') || 'all'); // all | batch id
  if (!date) return { ok: false, error: 'Please choose a date.' };

  const affected = await db.select().from(classSessions).where(
    scope === 'all'
      ? eq(classSessions.date, date)
      : and(eq(classSessions.date, date), eq(classSessions.batchId, Number(scope))),
  );
  if (!affected.length) return { ok: false, error: 'No classes are scheduled on that date.' };

  for (const session of affected) {
    // Find this batch's later sessions so we can shift the whole tail by one slot.
    const tail = (await db.select().from(classSessions)
      .where(and(eq(classSessions.batchId, session.batchId), gte(classSessions.classNumber, session.classNumber)))
    ).sort((a, b) => a.classNumber - b.classNumber);

    // Next weekly slot = gap between the last two known dates (fallback: +7 days)
    const all = (await db.select().from(classSessions).where(eq(classSessions.batchId, session.batchId)))
      .sort((a, b) => a.date.localeCompare(b.date));
    const idx = all.findIndex((s) => s.id === session.id);
    const after = all[idx + 1];
    let shiftTo: string;
    if (after) {
      shiftTo = after.date;
      // push every following session one slot later
      const dates = all.slice(idx + 1).map((s) => s.date);
      const gap = dates.length > 1
        ? (new Date(dates[1]).getTime() - new Date(dates[0]).getTime()) / 86400000
        : 7;
      const lastDate = new Date(all[all.length - 1].date + 'T00:00:00');
      lastDate.setDate(lastDate.getDate() + Math.max(1, Math.round(gap)));
      for (let i = all.length - 1; i > idx; i--) {
        const target = i === all.length - 1 ? lastDate.toISOString().slice(0, 10) : all[i + 1].date;
        await db.update(classSessions).set({ date: target }).where(eq(classSessions.id, all[i].id));
      }
    } else {
      const d = new Date(date + 'T00:00:00');
      d.setDate(d.getDate() + 7);
      shiftTo = d.toISOString().slice(0, 10);
    }

    await db.update(classSessions)
      .set({ date: shiftTo, note: `Postponed from ${date}${reason ? ` — ${reason}` : ''}` })
      .where(eq(classSessions.id, session.id));

    const b = (await db.select().from(batches).where(eq(batches.id, session.batchId)).limit(1))[0];
    if (b) {
      const course = (await db.select().from(courses).where(eq(courses.id, b.courseId)).limit(1))[0];
      const ids = await batchStudentIds(b.id);
      await notifyMany(ids, { ...TEMPLATES.offDay(date, reason), actionUrl: '/portal' });
      if (course) {
        await notifyMany(ids, {
          ...TEMPLATES.classPostponed(course.title, session.classNumber, date, shiftTo),
          actionUrl: '/portal',
        });
      }
    }
    void tail;
  }

  refresh();
  return { ok: true, moved: affected.length };
}

export async function markMessageRead(formData: FormData) {
  const id = Number(formData.get('id'));
  await db.update(messages).set({ readAt: new Date() }).where(eq(messages.id, id));
  revalidatePath('/portal', 'layout');
}
