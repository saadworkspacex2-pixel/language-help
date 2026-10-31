'use server';

import { db } from '@/db';
import { enrollments, users, homeworkSubmissions, homeworkAssignees } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { saveUpload } from '@/lib/upload';
import { revalidatePath } from 'next/cache';

export async function requestEnrollment(formData: FormData) {
  const user = await requireRole('student');
  const courseId = Number(formData.get('courseId'));
  const batchIdRaw = formData.get('batchId');
  const batchId = batchIdRaw ? Number(batchIdRaw) : null;
  if (!courseId) return { ok: false, error: 'Please choose a course.' };

  const dup = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.studentId, user.id), eq(enrollments.courseId, courseId)))
    .limit(1);
  if (dup.length) return { ok: false, error: 'You already have an enrollment for this course.' };

  await db.insert(enrollments).values({
    studentId: user.id, courseId, batchId, status: 'pending',
    includeBook: String(formData.get('includeBook') || '1') === '1',
    bookVariantId: formData.get('bookVariantId') ? Number(formData.get('bookVariantId')) : null,
  });
  revalidatePath('/portal');
  revalidatePath('/admin/enrollments');
  return { ok: true };
}

export async function updateProfile(formData: FormData) {
  const user = await requireRole('student');
  const photo = formData.get('photo') as File | null;
  const imagePath = await saveUpload(photo, 'student');

  await db
    .update(users)
    .set({
      name: String(formData.get('name') || user.name),
      phone: String(formData.get('phone') ?? user.phone ?? ''),
      whatsapp: String(formData.get('whatsapp') ?? ''),
      fatherName: String(formData.get('fatherName') ?? ''),
      motherName: String(formData.get('motherName') ?? ''),
      className: String(formData.get('className') ?? ''),
      address: String(formData.get('address') ?? ''),
      ...(imagePath ? { profileImage: imagePath } : {}),
    })
    .where(eq(users.id, user.id));

  revalidatePath('/portal', 'layout');
  return { ok: true };
}

export async function submitHomework(formData: FormData) {
  const user = await requireRole('student');
  const homeworkId = Number(formData.get('homeworkId'));
  const note = String(formData.get('note') || '');
  const image = formData.get('image') as File | null;

  if (!homeworkId) return { ok: false, error: 'Missing homework.' };

  // Ensure the student is assigned to this homework
  const assigned = await db
    .select({ id: homeworkAssignees.id })
    .from(homeworkAssignees)
    .where(and(eq(homeworkAssignees.homeworkId, homeworkId), eq(homeworkAssignees.studentId, user.id)))
    .limit(1);
  if (!assigned.length) return { ok: false, error: 'This homework is not assigned to you.' };

  const imageUrl = await saveUpload(image, 'hw');
  if (!imageUrl) return { ok: false, error: 'Please upload a photo of your homework.' };

  const existing = await db
    .select({ id: homeworkSubmissions.id })
    .from(homeworkSubmissions)
    .where(and(eq(homeworkSubmissions.homeworkId, homeworkId), eq(homeworkSubmissions.studentId, user.id)))
    .limit(1);

  if (existing.length) {
    await db
      .update(homeworkSubmissions)
      .set({ imageUrl, note, status: 'submitted', submittedAt: new Date() })
      .where(eq(homeworkSubmissions.id, existing[0].id));
  } else {
    await db.insert(homeworkSubmissions).values({ homeworkId, studentId: user.id, imageUrl, note });
  }

  revalidatePath('/portal', 'layout');
  return { ok: true };
}
