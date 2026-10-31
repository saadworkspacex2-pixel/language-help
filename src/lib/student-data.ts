import { db } from '@/db';
import {
  attendance, batches, certificates, classSessions, courses, enrollments,
  homework, homeworkAssignees, homeworkSubmissions, notices, payments, schedules, users,
} from '@/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { effectiveFee, todayStr } from '@/lib/utils';

export type EnrollmentBundle = Awaited<ReturnType<typeof getEnrollmentBundles>>[number];

export async function getEnrollmentBundles(studentId: number) {
  const ens = await db.select().from(enrollments).where(eq(enrollments.studentId, studentId)).orderBy(desc(enrollments.id));
  return Promise.all(
    ens.map(async (en) => {
      const course = (await db.select().from(courses).where(eq(courses.id, en.courseId)).limit(1))[0];
      const batch = en.batchId
        ? (await db.select().from(batches).where(eq(batches.id, en.batchId)).limit(1))[0] ?? null
        : null;
      const sched = batch ? await db.select().from(schedules).where(eq(schedules.batchId, batch.id)) : [];
      const sessions = batch ? await db.select().from(classSessions).where(eq(classSessions.batchId, batch.id)).orderBy(classSessions.classNumber) : [];
      const paid = await db.select().from(payments).where(eq(payments.enrollmentId, en.id));
      const certificate = (await db.select().from(certificates).where(eq(certificates.enrollmentId, en.id)).limit(1))[0] ?? null;

      const total = (course ? effectiveFee(course) : 0) + (course?.bookFee ?? 0);
      const paidSum = paid.reduce((s, p) => s + p.amount, 0);
      const completedCount = sessions.filter((s) => s.status === 'completed').length;
      const next = sessions.filter((s) => s.status === 'scheduled' && s.date >= todayStr()).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;

      return { enrollment: en, course, batch, sched, sessions, paid, paidSum, total, outstanding: Math.max(0, total - paidSum), completedCount, next, certificate };
    }),
  );
}

export async function getStudentOverview(studentId: number) {
  const bundles = await getEnrollmentBundles(studentId);
  const confirmed = bundles.filter((b) => b.enrollment.status === 'confirmed');

  const sessionIds = confirmed.flatMap((b) => b.sessions.map((s) => s.id));
  const att = sessionIds.length
    ? await db.select().from(attendance).where(and(eq(attendance.studentId, studentId), inArray(attendance.sessionId, sessionIds)))
    : [];
  const attended = att.filter((a) => a.status === 'present' || a.status === 'late').length;
  const attendancePct = att.length ? Math.round((attended / att.length) * 100) : null;

  const noticeList = await db.select().from(notices).where(inArray(notices.audience, ['all', 'students'])).orderBy(desc(notices.id));

  const nextUp = confirmed
    .filter((b) => b.next)
    .map((b) => ({
      courseTitle: b.course?.title ?? '', session: b.next!,
      time: b.sched[0]?.time ?? '',
    }))
    .sort((a, b) => a.session.date.localeCompare(b.session.date))[0] ?? null;

  return {
    bundles, confirmed, attendancePct, notices: noticeList, nextUp,
    outstanding: confirmed.reduce((s, b) => s + b.outstanding, 0),
    certificates: confirmed.filter((b) => b.certificate).map((b) => ({ cert: b.certificate!, course: b.course })),
  };
}

export async function getEnrollmentDetail(enrollmentId: number, studentId: number) {
  const all = await getEnrollmentBundles(studentId);
  const bundle = all.find((b) => b.enrollment.id === enrollmentId) ?? null;
  if (!bundle) return null;

  const myAttendance = bundle.sessions.length
    ? await db.select().from(attendance).where(and(eq(attendance.studentId, studentId), inArray(attendance.sessionId, bundle.sessions.map((s) => s.id).concat(0))))
    : [];

  const assigned = await db
    .select({ hw: homework })
    .from(homeworkAssignees)
    .innerJoin(homework, eq(homeworkAssignees.homeworkId, homework.id))
    .where(and(eq(homeworkAssignees.studentId, studentId), eq(homework.courseId, bundle.enrollment.courseId)))
    .orderBy(desc(homework.id));

  const mySubs = await db.select().from(homeworkSubmissions).where(eq(homeworkSubmissions.studentId, studentId));
  const teacher = bundle.course?.teacherId
    ? (await db.select().from(users).where(eq(users.id, bundle.course.teacherId)).limit(1))[0] ?? null
    : null;

  return { bundle, myAttendance, homework: assigned.map((a) => a.hw), submissions: mySubs, teacher };
}
