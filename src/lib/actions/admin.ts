'use server';

import { db } from '@/db';
import {
  courses, batches, schedules, enrollments, enrollmentRequests, classSessions,
  attendance, payments, certificates, notices, galleryItems, branches, settings, users,
} from '@/db/schema';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { hashPassword } from '@/lib/password';
import { saveUpload } from '@/lib/upload';
import { slugify, effectiveFee } from '@/lib/utils';
import { notify, notifyMany, broadcastNotice, batchStudentIds, enrollmentContext, TEMPLATES } from '@/lib/notify';
import { DAYS } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

const refresh = () => revalidatePath('/', 'layout');

// ---------------- Courses ----------------
export async function upsertCourse(prev: unknown, formData: FormData) {
  await requireRole('management');
  const id = formData.get('id') ? Number(formData.get('id')) : null;
  const title = String(formData.get('title') || '').trim();
  if (!title) return { ok: false, error: 'Title is required.' };
  const slug = String(formData.get('slug') || '').trim() || slugify(title);
  const bannerFile = formData.get('banner') as File | null;
  const banner = await saveUpload(bannerFile, 'course');

  const data = {
    slug,
    title,
    subtitle: String(formData.get('subtitle') || ''),
    description: String(formData.get('description') || ''),
    level: String(formData.get('level') || ''),
    ageRange: String(formData.get('ageRange') || ''),
    teacherId: formData.get('teacherId') ? Number(formData.get('teacherId')) : null,
    durationWeeks: Number(formData.get('durationWeeks') || 0) || null,
    totalClasses: Number(formData.get('totalClasses') || 22),
    fee: Number(formData.get('fee') || 0),
    offerFee: formData.get('offerFee') ? Number(formData.get('offerFee')) : null,
    bookFee: Number(formData.get('bookFee') || 300),
    outcomes: String(formData.get('outcomes') || '').split('\n').map((s) => s.trim()).filter(Boolean),
    active: formData.get('active') === 'on',
    ...(banner ? { banner } : {}),
  };

  try {
    if (id) {
      await db.update(courses).set(data).where(eq(courses.id, id));
    } else {
      await db.insert(courses).values({ ...data, banner: banner ?? null });
    }
  } catch {
    return { ok: false, error: 'Slug already exists or invalid data.' };
  }
  refresh();
  return { ok: true };
}

export async function toggleCourseActive(formData: FormData) {
  await requireRole('management');
  const id = Number(formData.get('id'));
  const active = formData.get('active') === '1';
  await db.update(courses).set({ active }).where(eq(courses.id, id));
  refresh();
}

// ---------------- Batches, schedules, sessions ----------------
export async function addBatch(formData: FormData) {
  await requireRole('management');
  const courseId = Number(formData.get('courseId'));
  const name = String(formData.get('name') || '').trim();
  const startDate = String(formData.get('startDate') || '') || null;
  if (!courseId || !name) return;
  await db.insert(batches).values({ courseId, name, startDate });
  refresh();
}

export async function deleteBatch(formData: FormData) {
  await requireRole('management');
  const batchId = Number(formData.get('id'));
  const sessions = await db.select({ id: classSessions.id }).from(classSessions).where(eq(classSessions.batchId, batchId));
  await db.delete(attendance).where(inArray(attendance.sessionId, sessions.map((s) => s.id).concat(0)));
  await db.delete(classSessions).where(eq(classSessions.batchId, batchId));
  await db.delete(schedules).where(eq(schedules.batchId, batchId));
  await db.update(enrollments).set({ batchId: null }).where(eq(enrollments.batchId, batchId));
  await db.delete(batches).where(eq(batches.id, batchId));
  refresh();
}

export async function setSchedule(formData: FormData) {
  await requireRole('management');
  const batchId = Number(formData.get('batchId'));
  const time = String(formData.get('time') || '').trim();
  const days = formData.getAll('days').map(Number);
  if (!batchId || !time || !days.length) return;
  await db.delete(schedules).where(eq(schedules.batchId, batchId));
  await db.insert(schedules).values(days.map((dayOfWeek) => ({ batchId, dayOfWeek, time })));

  const b = (await db.select().from(batches).where(eq(batches.id, batchId)).limit(1))[0];
  if (b) {
    const course = (await db.select().from(courses).where(eq(courses.id, b.courseId)).limit(1))[0];
    if (course) {
      await notifyMany(await batchStudentIds(batchId), {
        ...TEMPLATES.routine(course.title, days.sort((a, z) => a - z).map((d) => DAYS[d]).join(' & '), time),
        actionUrl: '/portal',
      });
    }
  }
  refresh();
}

/** Generate class sessions for a batch from its weekly schedule, up to the course's totalClasses. */
export async function generateSessions(formData: FormData) {
  await requireRole('management');
  const batchId = Number(formData.get('batchId'));
  const batchRows = await db.select().from(batches).where(eq(batches.id, batchId)).limit(1);
  const batch = batchRows[0];
  if (!batch) return { ok: false, error: 'Batch not found.' };
  const existing = await db.select({ id: classSessions.id }).from(classSessions).where(eq(classSessions.batchId, batchId)).limit(1);
  if (existing.length) return { ok: false, error: 'Sessions already generated. Delete the batch to regenerate.' };
  const sched = await db.select().from(schedules).where(eq(schedules.batchId, batchId));
  if (!batch.startDate || !sched.length) return { ok: false, error: 'Set a start date and weekly schedule first.' };
  const courseRows = await db.select().from(courses).where(eq(courses.id, batch.courseId)).limit(1);
  const total = courseRows[0]?.totalClasses ?? 22;

  const days = sched.map((s) => s.dayOfWeek).sort((a, b) => a - b);
  const dates: string[] = [];
  const cursor = new Date(batch.startDate + 'T00:00:00');
  while (dates.length < total) {
    if (days.includes(cursor.getDay())) dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  await db.insert(classSessions).values(dates.map((date, i) => ({ batchId, classNumber: i + 1, date })));
  await db.update(batches).set({ endDate: dates[dates.length - 1], status: 'running' }).where(eq(batches.id, batchId));
  refresh();
  return { ok: true };
}

export async function completeSession(formData: FormData) {
  await requireRole('management');
  const sessionId = Number(formData.get('id'));
  const rows = await db.select().from(classSessions).where(eq(classSessions.id, sessionId)).limit(1);
  const session = rows[0];
  if (!session) return;
  await db.update(classSessions).set({ status: 'completed' }).where(eq(classSessions.id, sessionId));

  const recipients = await batchStudentIds(session.batchId);
  // Auto-issue certificates when the final class of the course is completed
  const batch = (await db.select().from(batches).where(eq(batches.id, session.batchId)).limit(1))[0];
  if (batch) {
    const course = (await db.select().from(courses).where(eq(courses.id, batch.courseId)).limit(1))[0];
    if (course) {
      const upcoming = (await db.select().from(classSessions)
        .where(and(eq(classSessions.batchId, batch.id), eq(classSessions.status, 'scheduled')))
        .orderBy(classSessions.date).limit(1))[0] ?? null;
      await notifyMany(recipients, {
        ...TEMPLATES.classCompleted(course.title, session.classNumber, course.totalClasses, upcoming?.date ?? null),
        actionUrl: '/portal',
      });
    }
    if (course && session.classNumber === course.totalClasses) {
      await db.update(batches).set({ status: 'completed' }).where(eq(batches.id, batch.id));
      const confirmed = await db.select().from(enrollments)
        .where(and(eq(enrollments.batchId, batch.id), eq(enrollments.status, 'confirmed')));
      const year = new Date().getFullYear();
      for (const en of confirmed) {
        const has = await db.select({ id: certificates.id }).from(certificates)
          .where(eq(certificates.enrollmentId, en.id)).limit(1);
        if (!has.length) {
          const serial = `LHBD-CERT-${year}-${String(en.id).padStart(4, '0')}`;
          await db.insert(certificates).values({ enrollmentId: en.id, serial });
          await notify({ userId: en.studentId, ...TEMPLATES.certificateReady(course.title), actionUrl: '/portal' });
        }
      }
    }
  }
  refresh();
}

export async function postponeSession(formData: FormData) {
  await requireRole('management');
  const sessionId = Number(formData.get('id'));
  const newDate = String(formData.get('newDate') || '');
  if (!newDate) return;
  const rows = await db.select().from(classSessions).where(eq(classSessions.id, sessionId)).limit(1);
  if (!rows.length) return;
  const old = rows[0];
  await db.update(classSessions).set({ date: newDate, note: `Postponed from ${old.date}` }).where(eq(classSessions.id, sessionId));

  const b = (await db.select().from(batches).where(eq(batches.id, old.batchId)).limit(1))[0];
  if (b) {
    const course = (await db.select().from(courses).where(eq(courses.id, b.courseId)).limit(1))[0];
    if (course) {
      await notifyMany(await batchStudentIds(b.id), {
        ...TEMPLATES.classPostponed(course.title, old.classNumber, old.date, newDate),
        actionUrl: '/portal',
      });
    }
  }
  refresh();
}

// ---------------- Enrollments & requests ----------------
export async function setEnrollmentStatus(formData: FormData) {
  await requireRole('management');
  const id = Number(formData.get('id'));
  const status = String(formData.get('status') || 'pending');
  const reason = String(formData.get('reason') || '');
  const batchIdRaw = formData.get('batchId');
  const batchId = batchIdRaw ? Number(batchIdRaw) : undefined;

  // 'verified' and 'no_answer' are contact stages; the enrollment stays pending.
  const dbStatus = status === 'verified' || status === 'no_answer' ? 'pending' : status;
  await db.update(enrollments)
    .set({ status: dbStatus, ...(batchId !== undefined ? { batchId } : {}) })
    .where(eq(enrollments.id, id));

  const ctx = await enrollmentContext(id);
  if (ctx?.course) {
    const title = ctx.course.title;
    const due = effectiveFee(ctx.course) + ctx.course.bookFee;
    let tpl;
    if (status === 'verified') tpl = TEMPLATES.enrollmentVerified(title, due);
    else if (status === 'no_answer') tpl = TEMPLATES.enrollmentCalledNoAnswer(title);
    else if (status === 'confirmed') tpl = TEMPLATES.enrollmentConfirmed(title, ctx.batch?.name ?? null, ctx.batch?.startDate ?? null);
    else if (status === 'rejected') tpl = TEMPLATES.enrollmentFailed(title, reason);
    if (tpl) await notify({ userId: ctx.en.studentId, ...tpl, actionUrl: '/portal' });
  }
  refresh();
}

export async function setRequestStatus(formData: FormData) {
  await requireRole('management');
  const id = Number(formData.get('id'));
  const status = String(formData.get('status') || 'new');
  await db.update(enrollmentRequests).set({ status }).where(eq(enrollmentRequests.id, id));
  refresh();
}

export async function updateStudent(formData: FormData) {
  await requireRole('management');
  const id = Number(formData.get('id'));
  await db.update(users).set({
    name: String(formData.get('name') || ''),
    phone: String(formData.get('phone') || ''),
    className: String(formData.get('className') || ''),
    fatherName: String(formData.get('fatherName') || ''),
    motherName: String(formData.get('motherName') || ''),
    address: String(formData.get('address') || ''),
  }).where(eq(users.id, id));
  refresh();
}

// ---------------- Payments ----------------
export async function recordPayment(formData: FormData) {
  const admin = await requireRole('management');
  const enrollmentId = Number(formData.get('enrollmentId'));
  const amount = Number(formData.get('amount') || 0);
  const note = String(formData.get('note') || '');
  if (!enrollmentId || !amount) return { ok: false, error: 'Enrollment and amount are required.' };
  await db.insert(payments).values({ enrollmentId, amount, note, receivedBy: admin.name, method: 'office' });

  const ctx = await enrollmentContext(enrollmentId);
  if (ctx?.course) {
    const allPays = await db.select().from(payments).where(eq(payments.enrollmentId, enrollmentId));
    const paid = allPays.reduce((s, p) => s + p.amount, 0);
    const total = effectiveFee(ctx.course) + ctx.course.bookFee;
    await notify({
      userId: ctx.en.studentId,
      ...TEMPLATES.paymentReceived(amount, ctx.course.title, Math.max(0, total - paid)),
      actionUrl: '/portal/payments',
    });
  }
  refresh();
  return { ok: true };
}

export async function deletePayment(formData: FormData) {
  await requireRole('management');
  await db.delete(payments).where(eq(payments.id, Number(formData.get('id'))));
  refresh();
}

// ---------------- Attendance ----------------
export async function saveAttendance(formData: FormData) {
  await requireRole('management');
  const sessionId = Number(formData.get('sessionId'));
  const raw = String(formData.get('entries') || '[]');
  let entries: { studentId: number; status: string }[] = [];
  try { entries = JSON.parse(raw); } catch { entries = []; }
  if (!sessionId) return { ok: false, error: 'Choose a session.' };
  await db.delete(attendance).where(eq(attendance.sessionId, sessionId));
  if (entries.length) {
    await db.insert(attendance).values(entries.map((e) => ({ sessionId, studentId: e.studentId, status: e.status })));
  }
  refresh();
  return { ok: true };
}

// ---------------- Notices ----------------
export async function createNotice(formData: FormData) {
  await requireRole('management');
  const title = String(formData.get('title') || '').trim();
  if (!title) return;
  const body = String(formData.get('body') || '');
  const audience = String(formData.get('audience') || 'all');
  await db.insert(notices).values({ title, body, audience });
  await broadcastNotice(title, body, audience);
  refresh();
}

export async function deleteNotice(formData: FormData) {
  await requireRole('management');
  await db.delete(notices).where(eq(notices.id, Number(formData.get('id'))));
  refresh();
}

// ---------------- Gallery ----------------
export async function addGalleryItem(formData: FormData) {
  await requireRole('management');
  const image = formData.get('image') as File | null;
  const imageUrl = await saveUpload(image, 'gallery');
  if (!imageUrl) return { ok: false, error: 'Please choose an image.' };
  await db.insert(galleryItems).values({ imageUrl, caption: String(formData.get('caption') || '') });
  refresh();
  return { ok: true };
}

export async function deleteGalleryItem(formData: FormData) {
  await requireRole('management');
  await db.delete(galleryItems).where(eq(galleryItems.id, Number(formData.get('id'))));
  refresh();
}

// ---------------- People (teachers / management / founder) ----------------
export async function upsertPerson(prev: unknown, formData: FormData) {
  await requireRole('management');
  const id = formData.get('id') ? Number(formData.get('id')) : null;
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const role = String(formData.get('role') || 'teacher');
  if (!name || !email) return { ok: false, error: 'Name and email are required.' };

  const photo = formData.get('photo') as File | null;
  const profileImage = await saveUpload(photo, 'person');
  const galleryRaw = String(formData.get('profileGallery') || '');
  const profileGallery = galleryRaw.split('\n').map((s) => s.trim()).filter(Boolean);
  const password = String(formData.get('password') || '');
  const isFounder = formData.get('isFounder') === 'on';

  const base = {
    name, email,
    role: role === 'management' ? 'management' : 'teacher',
    phone: String(formData.get('phone') || ''),
    experience: String(formData.get('experience') || ''),
    bio: String(formData.get('bio') || ''),
    degrees: String(formData.get('degrees') || ''),
    studyBackground: String(formData.get('studyBackground') || ''),
    age: Number(formData.get('age') || 0) || null,
    showOnSite: true,
    isFounder: isFounder && role !== 'management',
    profileGallery,
  };

  try {
    if (isFounder && role !== 'management') {
      await db.update(users).set({ isFounder: false }).where(eq(users.isFounder, true));
    }
    if (id) {
      await db.update(users).set({
        ...base,
        ...(profileImage ? { profileImage } : {}),
        ...(password ? { passwordHash: hashPassword(password) } : {}),
      }).where(eq(users.id, id));
    } else {
      if (!password) return { ok: false, error: 'Set a password for the new account.' };
      await db.insert(users).values({
        ...base,
        passwordHash: hashPassword(password),
        ...(profileImage ? { profileImage } : {}),
      });
    }
  } catch {
    return { ok: false, error: 'Email already in use.' };
  }
  refresh();
  void sql; void asc;
  return { ok: true };
}

export async function deletePerson(formData: FormData) {
  await requireRole('management');
  const id = Number(formData.get('id'));
  await db.update(courses).set({ teacherId: null }).where(eq(courses.teacherId, id));
  await db.delete(users).where(eq(users.id, id));
  refresh();
}

// ---------------- Branches & settings ----------------
export async function saveBranch(formData: FormData) {
  await requireRole('management');
  const id = formData.get('id') ? Number(formData.get('id')) : null;
  const name = String(formData.get('name') || '').trim();
  if (!name) return;
  const isMain = formData.get('isMain') === 'on';
  if (isMain) await db.update(branches).set({ isMain: false }).where(eq(branches.isMain, true));
  const data = {
    name,
    address: String(formData.get('address') || ''),
    phone: String(formData.get('phone') || ''),
    mapEmbed: String(formData.get('mapEmbed') || ''),
    isMain,
  };
  if (id) await db.update(branches).set(data).where(eq(branches.id, id));
  else await db.insert(branches).values(data);
  refresh();
}

export async function deleteBranch(formData: FormData) {
  await requireRole('management');
  await db.delete(branches).where(eq(branches.id, Number(formData.get('id'))));
  refresh();
}

export async function saveSettings(formData: FormData) {
  await requireRole('management');
  for (const key of ['phone', 'whatsapp', 'email', 'address']) {
    const value = String(formData.get(key) || '');
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  refresh();
}
