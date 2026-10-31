'use server';

import { db } from '@/db';
import { enrollmentRequests, contactMessages, branches, settings } from '@/db/schema';
import { saveUpload } from '@/lib/upload';
import { revalidatePath } from 'next/cache';

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
    await db.insert(contactMessages).values({
      name,
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      message,
    });
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
