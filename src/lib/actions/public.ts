'use server';

import { db } from '@/db';
import { enrollmentRequests, contactMessages, branches, settings } from '@/db/schema';
import { saveUpload } from '@/lib/upload';
import { revalidatePath } from 'next/cache';
import { sendTemplateEmail } from '@/lib/email-send';
import { eq } from 'drizzle-orm';
import { courses } from '@/db/schema';

export async function submitEnrollmentRequest(formData: FormData) {
  try {
    const courseId = Number(formData.get('courseId'));
    const fullName = String(formData.get('fullName') || '').trim();
    const mobile = String(formData.get('mobile') || '').trim();
    if (!courseId || !fullName || !mobile) return { ok: false, error: 'Please fill in all required fields.' };

    const photo = formData.get('photo') as File | null;
    const profileImage = await saveUpload(photo, 'student');

    await db.insert(enrollmentRequests).values({
      courseId,
      fullName,
      className: String(formData.get('className') || ''),
      mobile,
      whatsapp: String(formData.get('whatsapp') || ''),
      email: String(formData.get('email') || ''),
      address: String(formData.get('address') || ''),
      fatherName: String(formData.get('fatherName') || ''),
      motherName: String(formData.get('motherName') || ''),
      profileImage,
      includeBook: String(formData.get('includeBook') || '1') === '1',
      bookVariantId: formData.get('bookVariantId') ? Number(formData.get('bookVariantId')) : null,
    });

    // Confirmation email — template editable in Admin → Automated Emails.
    const course = (await db.select().from(courses).where(eq(courses.id, courseId)).limit(1))[0];
    await sendTemplateEmail('enrollment_received', String(formData.get('email') || ''), {
      name: fullName,
      course: course?.title ?? 'your course',
      link: '/portal',
    });

    revalidatePath('/admin/enrollments');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

export async function submitContact(formData: FormData) {
  try {
    const name = String(formData.get('name') || '').trim();
    const message = String(formData.get('message') || '').trim();
    if (!name || !message) return { ok: false, error: 'Please add your name and message.' };
    const email = String(formData.get('email') || '').trim();
    await db.insert(contactMessages).values({
      name,
      email,
      phone: String(formData.get('phone') || ''),
      message,
    });

    // Auto-reply so the sender knows the message arrived.
    await sendTemplateEmail('contact_reply', email, { name });

    return { ok: true };
  } catch {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

export async function getSiteInfo() {
  const [s, b] = await Promise.all([db.select().from(settings), db.select().from(branches)]);
  const map: Record<string, string> = {};
  for (const row of s) map[row.key] = row.value ?? '';
  return {
    phone: map.phone || '+880 1700-000000',
    whatsapp: map.whatsapp || '8801700000000',
    email: map.email || 'hello@languagehelpbd.com',
    address: map.address || 'House 12, Road 5, Dhanmondi, Dhaka 1205',
    branches: b,
  };
}
