'use server';

import { db } from '@/db';
import { homework, homeworkAssignees, homeworkSubmissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function createHomework(formData: FormData) {
  const user = await requireRole('teacher');
  const courseId = Number(formData.get('courseId'));
  const batchIdRaw = formData.get('batchId');
  const batchId = batchIdRaw ? Number(batchIdRaw) : null;
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '');
  const dueDate = String(formData.get('dueDate') || '') || null;
  const studentIds = formData.getAll('students').map(Number).filter(Boolean);

  if (!courseId || !title) return { ok: false, error: 'Course and title are required.' };
  if (!studentIds.length) return { ok: false, error: 'Select at least one student.' };

  const inserted = await db
    .insert(homework)
    .values({ courseId, batchId, teacherId: user.id, title, description, dueDate })
    .returning({ id: homework.id });

  await db.insert(homeworkAssignees).values(
    studentIds.map((studentId) => ({ homeworkId: inserted[0].id, studentId })),
  );

  revalidatePath('/teacher/homework');
  return { ok: true };
}

export async function markSubmission(formData: FormData) {
  const user = await requireRole('teacher');
  const submissionId = Number(formData.get('submissionId'));
  const marks = String(formData.get('marks') || '').trim();
  const feedback = String(formData.get('feedback') || '').trim();
  const unmark = formData.get('unmark') === '1';
  if (!submissionId) return { ok: false, error: 'Missing submission.' };

  await db
    .update(homeworkSubmissions)
    .set(unmark
      ? { marks: null, feedback: null, status: 'submitted' }
      : { marks, feedback, status: marks || feedback ? 'marked' : 'submitted' })
    .where(eq(homeworkSubmissions.id, submissionId));

  revalidatePath('/teacher/homework');
  void user;
  return { ok: true };
}

export async function deleteHomework(formData: FormData) {
  await requireRole('teacher');
  const id = Number(formData.get('id'));
  await db.delete(homeworkAssignees).where(eq(homeworkAssignees.homeworkId, id));
  await db.delete(homeworkSubmissions).where(eq(homeworkSubmissions.homeworkId, id));
  await db.delete(homework).where(eq(homework.id, id));
  revalidatePath('/teacher/homework');
  return { ok: true };
}
