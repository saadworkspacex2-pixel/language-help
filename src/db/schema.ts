import {
  pgTable, serial, text, integer, boolean, timestamp, date,
} from 'drizzle-orm/pg-core';

// ---------- Users (students, teachers, management, founder) ----------
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  role: text('role').notNull().default('student'), // student | teacher | management
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(), // "!" prefix = passwordless (Google / OTP) account
  googleId: text('google_id').unique(), // Google account subject id
  studentId: text('student_id').unique(),
  fatherName: text('father_name'),
  motherName: text('mother_name'),
  className: text('class_name'),
  address: text('address'),
  whatsapp: text('whatsapp'),
  profileImage: text('profile_image'),
  bio: text('bio'),
  studyBackground: text('study_background'),
  degrees: text('degrees'),
  age: integer('age'),
  experience: text('experience'),
  isFounder: boolean('is_founder').notNull().default(false),
  showOnSite: boolean('show_on_site').notNull().default(true),
  profileGallery: text('profile_gallery').array(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ---------- One-time login codes (email OTP) ----------
export const otpCodes = pgTable('otp_codes', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  codeHash: text('code_hash').notNull(),
  purpose: text('purpose').notNull().default('login'),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  consumedAt: timestamp('consumed_at', { mode: 'date' }),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ---------- Courses ----------
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  level: text('level'),
  ageRange: text('age_range'),
  teacherId: integer('teacher_id').references(() => users.id),
  durationWeeks: integer('duration_weeks'),
  totalClasses: integer('total_classes').notNull().default(22),
  fee: integer('fee').notNull().default(0),
  offerFee: integer('offer_fee'),
  bookFee: integer('book_fee').notNull().default(300),
  banner: text('banner'),
  outcomes: text('outcomes').array(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ---------- Batches & Schedules ----------
export const batches = pgTable('batches', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull().references(() => courses.id),
  name: text('name').notNull(),
  startDate: date('start_date', { mode: 'string' }),
  endDate: date('end_date', { mode: 'string' }),
  status: text('status').notNull().default('upcoming'), // upcoming | running | completed
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  batchId: integer('batch_id').notNull().references(() => batches.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday
  time: text('time').notNull(),
});

// ---------- Enrollments (portal) ----------
export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => users.id),
  courseId: integer('course_id').notNull().references(() => courses.id),
  batchId: integer('batch_id').references(() => batches.id),
  includeBook: boolean('include_book').notNull().default(true),
  bookVariantId: integer('book_variant_id'),
  status: text('status').notNull().default('pending'), // pending | confirmed | rejected
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// Public enrollment requests (no account needed)
export const enrollmentRequests = pgTable('enrollment_requests', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull().references(() => courses.id),
  fullName: text('full_name').notNull(),
  className: text('class_name'),
  mobile: text('mobile').notNull(),
  whatsapp: text('whatsapp'),
  email: text('email'),
  address: text('address'),
  fatherName: text('father_name'),
  motherName: text('mother_name'),
  profileImage: text('profile_image'),
  includeBook: boolean('include_book').notNull().default(true),
  bookVariantId: integer('book_variant_id'),
  status: text('status').notNull().default('new'), // new | contacted | closed
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ---------- Class sessions & attendance ----------
export const classSessions = pgTable('class_sessions', {
  id: serial('id').primaryKey(),
  batchId: integer('batch_id').notNull().references(() => batches.id),
  classNumber: integer('class_number').notNull(),
  date: date('date', { mode: 'string' }).notNull(),
  status: text('status').notNull().default('scheduled'), // scheduled | completed | postponed | cancelled
  note: text('note'),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => classSessions.id),
  studentId: integer('student_id').notNull().references(() => users.id),
  status: text('status').notNull().default('present'), // present | absent | late
});

// ---------- Homework ----------
export const homework = pgTable('homework', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull().references(() => courses.id),
  batchId: integer('batch_id').references(() => batches.id),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: date('due_date', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const homeworkAssignees = pgTable('homework_assignees', {
  id: serial('id').primaryKey(),
  homeworkId: integer('homework_id').notNull().references(() => homework.id),
  studentId: integer('student_id').notNull().references(() => users.id),
});

export const homeworkSubmissions = pgTable('homework_submissions', {
  id: serial('id').primaryKey(),
  homeworkId: integer('homework_id').notNull().references(() => homework.id),
  studentId: integer('student_id').notNull().references(() => users.id),
  imageUrl: text('image_url').notNull(),
  note: text('note'),
  marks: text('marks'),
  feedback: text('feedback'),
  status: text('status').notNull().default('submitted'), // submitted | marked
  submittedAt: timestamp('submitted_at', { mode: 'date' }).notNull().defaultNow(),
});

// ---------- Payments & certificates ----------
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  enrollmentId: integer('enrollment_id').notNull().references(() => enrollments.id),
  amount: integer('amount').notNull(),
  method: text('method').notNull().default('office'),
  note: text('note'),
  receivedBy: text('received_by'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  enrollmentId: integer('enrollment_id').notNull().references(() => enrollments.id),
  serial: text('serial').notNull().unique(),
  issuedAt: timestamp('issued_at', { mode: 'date' }).notNull().defaultNow(),
});

// ---------- Content ----------
export const notices = pgTable('notices', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body'),
  audience: text('audience').notNull().default('all'), // all | students | teachers
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const galleryItems = pgTable('gallery', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const branches = pgTable('branches', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  mapEmbed: text('map_embed'),
  isMain: boolean('is_main').notNull().default(false),
});

export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  message: text('message'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value'),
});

// ---------- Autonomous messaging ----------
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id), // null = broadcast
  title: text('title').notNull(),
  body: text('body').notNull(),
  category: text('category').notNull().default('update'), // enrollment | class | payment | notice | certificate | update
  tone: text('tone').notNull().default('info'), // info | success | warning | danger
  channel: text('channel').notNull().default('portal'), // portal | sms | whatsapp | email
  actionUrl: text('action_url'),
  readAt: timestamp('read_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ---------- Book shop ----------
export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  author: text('author'),
  coverImage: text('cover_image'),
  previewPdf: text('preview_pdf'),
  previewImages: text('preview_images').array(),
  pages: integer('pages'),
  language: text('language'),
  courseId: integer('course_id').references(() => courses.id),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const bookVariants = pgTable('book_variants', {
  id: serial('id').primaryKey(),
  bookId: integer('book_id').notNull().references(() => books.id),
  name: text('name').notNull(), // Colourful | Black & White | E-book
  kind: text('kind').notNull().default('print'), // print | ebook
  price: integer('price').notNull().default(0),
  offerPrice: integer('offer_price'),
  inStock: boolean('in_stock').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const bookOrders = pgTable('book_orders', {
  id: serial('id').primaryKey(),
  bookId: integer('book_id').notNull().references(() => books.id),
  variantId: integer('variant_id').notNull().references(() => bookVariants.id),
  userId: integer('user_id').references(() => users.id),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  quantity: integer('quantity').notNull().default(1),
  amount: integer('amount').notNull().default(0),
  status: text('status').notNull().default('new'), // new | confirmed | delivered | cancelled
  note: text('note'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type Book = typeof books.$inferSelect;
export type BookVariant = typeof bookVariants.$inferSelect;
export type Message = typeof messages.$inferSelect;

// ---------- Auth sessions ----------
export const authSessions = pgTable('auth_sessions', {
  token: text('token').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
});

// ---------- Editable automated email templates ----------
export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(), // otp_login, enrollment_received, …
  subject: text('subject').notNull().default(''),
  bodyHtml: text('body_html').notNull().default(''),
  enabled: boolean('enabled').notNull().default(true),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export type EmailTemplateRow = typeof emailTemplates.$inferSelect;

export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type ClassSession = typeof classSessions.$inferSelect;
