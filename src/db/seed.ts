import 'dotenv/config';
import { db, pool } from './index';
import {
  attendance, batches, branches, classSessions, courses, enrollments,
  galleryItems, homework, homeworkAssignees, notices, payments, schedules,
  settings, users,
} from './schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../lib/password';

const IMG = {
  classA: 'https://images.pexels.com/photos/6503155/pexels-photo-6503155.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  classB: 'https://images.pexels.com/photos/7092455/pexels-photo-7092455.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  classC: 'https://images.pexels.com/photos/35745581/pexels-photo-35745581.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  classD: 'https://images.pexels.com/photos/8199151/pexels-photo-8199151.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  classE: 'https://images.pexels.com/photos/37795357/pexels-photo-37795357.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  classF: 'https://images.pexels.com/photos/6502823/pexels-photo-6502823.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  classG: 'https://images.pexels.com/photos/6503100/pexels-photo-6503100.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  classH: 'https://images.pexels.com/photos/6502822/pexels-photo-6502822.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  founder: 'https://images.pexels.com/photos/6325958/pexels-photo-6325958.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
  tWoman: 'https://images.pexels.com/photos/5212321/pexels-photo-5212321.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
  tMan: 'https://images.pexels.com/photos/37218479/pexels-photo-37218479.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
  tWoman2: 'https://images.pexels.com/photos/6981004/pexels-photo-6981004.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
  mWoman: 'https://images.pexels.com/photos/8423069/pexels-photo-8423069.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
};

function weekDates(start: string, days: number[], count: number): string[] {
  const out: string[] = [];
  const cursor = new Date(start + 'T00:00:00');
  while (out.length < count) {
    if (days.includes(cursor.getDay())) out.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

const offset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

async function main() {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, 'admin@lhbd.com')).limit(1);
  if (existing.length) {
    console.log('Seed already applied — skipping.');
    await pool.end();
    return;
  }

  // Settings & branches
  await db.insert(settings).values([
    { key: 'phone', value: '+880 1712-345678' },
    { key: 'whatsapp', value: '8801712345678' },
    { key: 'email', value: 'hello@languagehelpbd.com' },
    { key: 'address', value: 'House 12, Road 5, Dhanmondi, Dhaka 1205' },
  ]);
  await db.insert(branches).values([
    {
      name: 'LHBD Dhanmondi (Main Campus)',
      address: 'House 12, Road 5, Dhanmondi, Dhaka 1205',
      phone: '+880 1712-345678',
      mapEmbed: 'https://www.google.com/maps?q=Dhanmondi,+Dhaka,+Bangladesh&output=embed',
      isMain: true,
    },
    {
      name: 'LHBD Uttara',
      address: 'Sector 7, Uttara, Dhaka 1230',
      phone: '+880 1712-345679',
      mapEmbed: 'https://www.google.com/maps?q=Uttara,+Dhaka,+Bangladesh&output=embed',
      isMain: false,
    },
  ]);

  // People
  const [admin] = await db.insert(users).values({
    role: 'management', name: 'LHBD Admin', email: 'admin@lhbd.com',
    passwordHash: hashPassword('admin123'), showOnSite: false,
  }).returning({ id: users.id });

  const [founder] = await db.insert(users).values({
    role: 'teacher', name: 'Md. Arif Rahman', email: 'founder@lhbd.com',
    passwordHash: hashPassword('founder123'), isFounder: true, showOnSite: true,
    profileImage: IMG.founder, age: 36,
    experience: '12+ years teaching English & Arabic',
    bio: 'Arif founded Language Help BD in 2018 with one classroom and a whiteboard. Today he leads a team of mentors helping thousands of learners across Dhaka speak with confidence. He believes language is learned through conversation, courage and consistency.',
    degrees: 'MA in English Language Teaching, University of Dhaka\nCELTA, Cambridge English\nDiploma in Modern Standard Arabic, IIUC',
    studyBackground: 'University of Dhaka · Cambridge English (UK)',
    profileGallery: [IMG.classG, IMG.classH],
  }).returning({ id: users.id });

  const [t1] = await db.insert(users).values({
    role: 'teacher', name: 'Nusrat Jahan', email: 'teacher@lhbd.com',
    passwordHash: hashPassword('teacher123'), showOnSite: true,
    profileImage: IMG.tWoman, age: 29,
    experience: '7 years · IELTS band 8.5 specialist',
    bio: 'Nusrat has guided 500+ students to their target IELTS bands through structured practice and honest feedback.',
    degrees: 'BA (Hons) English, NSU\nIELTS Train the Trainer, British Council',
    studyBackground: 'North South University', profileGallery: [IMG.classE],
  }).returning({ id: users.id });

  const [t2] = await db.insert(users).values({
    role: 'teacher', name: 'Tanvir Hasan', email: 'tanvir@lhbd.com',
    passwordHash: hashPassword('teacher123'), showOnSite: true,
    profileImage: IMG.tMan, age: 26,
    experience: '5 years · Kids & teens English',
    bio: 'Tanvir turns classrooms into playgrounds of words — his young learners beg their parents not to miss class.',
    degrees: 'BA English, Stamford University\nTKT (Young Learners), Cambridge',
    studyBackground: 'Stamford University Bangladesh',
  }).returning({ id: users.id });

  const [t3] = await db.insert(users).values({
    role: 'teacher', name: 'Sadia Akter', email: 'sadia@lhbd.com',
    passwordHash: hashPassword('teacher123'), showOnSite: true,
    profileImage: IMG.tWoman2, age: 30,
    experience: '8 years · Japanese JLPT & Korean TOPIK',
    bio: 'After living in Osaka and Seoul, Sadia brings real East-Asian culture and conversation into every lesson.',
    degrees: 'JLPT N1\nTOPIK Level 5\nMA Japanese Studies, University of Dhaka',
    studyBackground: 'University of Dhaka · Osaka exchange program', profileGallery: [IMG.classD],
  }).returning({ id: users.id });

  await db.insert(users).values({
    role: 'management', name: 'Farhana Karim', email: 'farhana@lhbd.com',
    passwordHash: hashPassword('manage123'), showOnSite: true,
    profileImage: IMG.mWoman,
    experience: 'Head of Operations & Admissions',
    bio: 'Farhana keeps the institution running — admissions, schedules and student care.',
  });

  // Courses
  const mkCourse = async (c: Parameters<typeof db.insert>[0] extends never ? never : {
    slug: string; title: string; subtitle: string; description: string; level: string;
    ageRange: string; teacherId: number; durationWeeks: number; totalClasses: number;
    fee: number; offerFee: number | null; banner: string; outcomes: string[];
  }) => {
    const [row] = await db.insert(courses).values({ ...c, bookFee: 300 }).returning({ id: courses.id });
    return row.id;
  };

  const seId = await mkCourse({
    slug: 'spoken-english-mastery', title: 'Spoken English Mastery',
    subtitle: 'From hesitation to fluent conversation — our most loved program.',
    description: 'A conversation-first English program that rebuilds how you think in English. Every class puts you on your feet: pair work, presentations, debates and real-life scenarios, wrapped around a tight grammar foundation.\n\nBy class 22 you will speak continuously for five minutes on any everyday topic — that is our promise.',
    level: 'Beginner to Advanced', ageRange: '14+', teacherId: founder.id,
    durationWeeks: 11, totalClasses: 22, fee: 5000, offerFee: 3999, banner: IMG.classA,
    outcomes: [
      'Speak for 5+ minutes on everyday topics, confidently',
      'Master the 12 core tenses through use, not memorisation',
      'Everyday vocabulary of 1,000+ active words',
      'Pronunciation & neutral accent training',
      'Presentations, debates and interview practice',
      'Listening drills with real conversations',
    ],
  });

  const ieltsId = await mkCourse({
    slug: 'ielts-preparation-intensive', title: 'IELTS Preparation Intensive',
    subtitle: 'Band 7+ focused training with weekly mock practice.',
    description: 'A complete IELTS program covering Listening, Reading, Writing and Speaking with band-descriptor-based feedback. Your writing tasks are marked line by line, every week.\n\nIncludes two full mock exams under real timing conditions.',
    level: 'Intermediate+', ageRange: '16+', teacherId: t1.id,
    durationWeeks: 11, totalClasses: 22, fee: 8000, offerFee: 6499, banner: IMG.classB,
    outcomes: [
      'Strategies for all four IELTS modules',
      'Task 1 & Task 2 writing frameworks with feedback',
      'Speaking simulation with real examiner-style questions',
      'Time-management techniques for Reading',
      'Two full-length mock tests with band estimate',
      'Personal error log and improvement plan',
    ],
  });

  await mkCourse({
    slug: 'english-for-kids', title: 'English for Kids',
    subtitle: 'Playful phonics, stories and songs for young learners.',
    description: 'A joyful introduction to English for children. Through phonics games, story time, songs and crafts, kids absorb the language the way they learned their mother tongue — naturally.\n\nParents receive a progress note after every class.',
    level: 'Foundation', ageRange: '6 – 12 years', teacherId: t2.id,
    durationWeeks: 11, totalClasses: 22, fee: 3500, offerFee: null, banner: IMG.classC,
    outcomes: [
      'Phonics and correct pronunciation from day one',
      'Everyday classroom and home vocabulary',
      'Simple sentence building through games',
      'Confidence speaking in front of others',
      'Story-telling and show-and-tell sessions',
      'Fun homework with stickers and stars',
    ],
  });

  await mkCourse({
    slug: 'japanese-language-n5', title: 'Japanese Language — N5',
    subtitle: 'Hiragana to your first real conversation, the JLPT way.',
    description: 'Learn Japanese from absolute zero with a mentor who has lived in Japan. Master hiragana and katakana in the first weeks, then build toward JLPT N5 grammar, kanji and listening.\n\nCultural sessions — anime, etiquette, food — keep every class alive.',
    level: 'Beginner (JLPT N5)', ageRange: '13+', teacherId: t3.id,
    durationWeeks: 11, totalClasses: 22, fee: 7000, offerFee: 5999, banner: IMG.classD,
    outcomes: [
      'Read and write Hiragana & Katakana fluently',
      '100+ essential Kanji characters',
      'JLPT N5 grammar patterns with practice',
      'Daily greetings and self-introduction',
      'Listening practice with native-speed audio',
      'Japanese culture, etiquette and expression',
    ],
  });

  await mkCourse({
    slug: 'korean-language-topik', title: 'Korean Language — TOPIK 1',
    subtitle: 'Hangul in a week, conversation by the end.',
    description: 'Hangul is one of the world’s most scientific writing systems — you will read it within your first week. From there, we build TOPIK 1 grammar, vocabulary and speaking with K-drama clips and role-play.',
    level: 'Beginner (TOPIK 1)', ageRange: '13+', teacherId: t3.id,
    durationWeeks: 11, totalClasses: 22, fee: 7000, offerFee: null, banner: IMG.classE,
    outcomes: [
      'Read and write Hangul confidently',
      'TOPIK 1 grammar and 800+ words',
      'Self-introduction and everyday dialogues',
      'Listening with real Korean media',
      'Honorifics and polite speech levels',
      'K-culture sessions every month',
    ],
  });

  await mkCourse({
    slug: 'arabic-language-essentials', title: 'Arabic Language Essentials',
    subtitle: 'Modern Standard Arabic for study, work and faith.',
    description: 'A structured path into Modern Standard Arabic — alphabet, pronunciation, grammar and vocabulary for students heading to Middle-East studies or work, and learners seeking deeper understanding.',
    level: 'Beginner', ageRange: '12+', teacherId: founder.id,
    durationWeeks: 11, totalClasses: 22, fee: 6000, offerFee: 4999, banner: IMG.classF,
    outcomes: [
      'Arabic alphabet with correct makharij pronunciation',
      'Core grammar (nahw) made simple',
      '600+ high-frequency words',
      'Reading short passages with vowels (harakat)',
      'Everyday greetings and expressions',
      'Introduction to listening comprehension',
    ],
  });

  // Batches + schedules
  const [batchA] = await db.insert(batches).values({
    courseId: seId, name: 'Batch A — Evening', startDate: offset(-14), status: 'running',
  }).returning({ id: batches.id });
  await db.insert(schedules).values([
    { batchId: batchA.id, dayOfWeek: 6, time: '5:00 – 6:30 PM' },
    { batchId: batchA.id, dayOfWeek: 1, time: '5:00 – 6:30 PM' },
  ]);

  const [batchB] = await db.insert(batches).values({
    courseId: seId, name: 'Batch B — Morning', startDate: offset(21), status: 'upcoming',
  }).returning({ id: batches.id });
  await db.insert(schedules).values([
    { batchId: batchB.id, dayOfWeek: 5, time: '10:00 – 11:30 AM' },
    { batchId: batchB.id, dayOfWeek: 2, time: '10:00 – 11:30 AM' },
  ]);

  const [ieltsBatch] = await db.insert(batches).values({
    courseId: ieltsId, name: 'Batch A — Night', startDate: offset(7), status: 'upcoming',
  }).returning({ id: batches.id });
  await db.insert(schedules).values([
    { batchId: ieltsBatch.id, dayOfWeek: 0, time: '7:00 – 8:30 PM' },
    { batchId: ieltsBatch.id, dayOfWeek: 3, time: '7:00 – 8:30 PM' },
  ]);

  // Generate sessions for Spoken English Batch A (22), first 3 completed
  const sessionDates = weekDates(offset(-14), [6, 1], 22);
  const sessionRows = await db.insert(classSessions).values(
    sessionDates.map((date, i) => ({
      batchId: batchA.id, classNumber: i + 1, date,
      status: i < 3 ? 'completed' : 'scheduled',
      note: i === 3 ? 'Postponed from ' + offset(-2) : null,
    })),
  ).returning({ id: classSessions.id });
  await db.update(batches).set({ endDate: sessionDates[sessionDates.length - 1] }).where(eq(batches.id, batchA.id));

  // Demo student
  const [student] = await db.insert(users).values({
    role: 'student', name: 'Rahim Uddin', email: 'student@lhbd.com',
    passwordHash: hashPassword('student123'), studentId: 'LHBD-2026-1001',
    phone: '01711223344', whatsapp: '01711223344', className: 'HSC 1st Year',
    fatherName: 'Abdul Karim', motherName: 'Rokeya Begum',
    address: 'Mohammadpur, Dhaka', showOnSite: false,
  }).returning({ id: users.id });

  const [enr] = await db.insert(enrollments).values({
    studentId: student.id, courseId: seId, batchId: batchA.id, status: 'confirmed',
  }).returning({ id: enrollments.id });

  // Payments: 2000 + 1000 of (3999 + 300)
  await db.insert(payments).values([
    { enrollmentId: enr.id, amount: 2000, note: 'Admission — 1st installment', receivedBy: 'LHBD Admin' },
    { enrollmentId: enr.id, amount: 1000, note: '2nd installment', receivedBy: 'LHBD Admin' },
  ]);

  // Attendance for the 3 completed sessions
  const attStatus = ['present', 'late', 'present'];
  for (let i = 0; i < 3; i++) {
    await db.insert(attendance).values({ sessionId: sessionRows[i].id, studentId: student.id, status: attStatus[i] });
  }

  // Homework assigned to demo student
  const [hw] = await db.insert(homework).values({
    courseId: seId, batchId: batchA.id, teacherId: founder.id,
    title: 'My Daily Routine — 12 sentences',
    description: 'Write 12 sentences about your daily routine using the present simple tense. Underline every verb. Write neatly on one page and upload a clear photo.',
    dueDate: offset(4),
  }).returning({ id: homework.id });
  await db.insert(homeworkAssignees).values({ homeworkId: hw.id, studentId: student.id });

  // Notices
  await db.insert(notices).values([
    { title: 'Eid holidays — classes resume Sunday', body: 'All batches will pause during Eid week. Your class numbers remain the same — postponed classes are shifted, not skipped.', audience: 'all' },
    { title: 'New Japanese N5 batch opening', body: 'Weekend batch for Japanese N5 opens next month. Early birds get ৳1,000 off the course fee.', audience: 'students' },
  ]);

  // Gallery
  await db.insert(galleryItems).values([
    { imageUrl: IMG.classG, caption: 'Speaking circle — Spoken English Batch A' },
    { imageUrl: IMG.classH, caption: 'One-on-one mentoring hour' },
    { imageUrl: IMG.classA, caption: 'Grammar games on the whiteboard' },
    { imageUrl: IMG.classB, caption: 'IELTS writing workshop' },
    { imageUrl: IMG.classC, caption: 'Discussion practice in pairs' },
    { imageUrl: IMG.classD, caption: 'Japanese calligraphy afternoon' },
    { imageUrl: IMG.classE, caption: 'Campus study session' },
    { imageUrl: IMG.classF, caption: 'Vocabulary challenge finals' },
  ]);

  console.log('Seed complete ✔  (admin id:', admin.id, ')');
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
