# Language Help BD — website, portals & admin

A complete language-school platform: public marketing site, admissions, student portal,
teacher workspace and a management back-office — in one Next.js app.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · Drizzle ORM · PostgreSQL 17
**Design:** custom skeuomorphic system (moulded panels, enamel buttons, recessed wells) on a solid white canvas.

---

## Features

**Public site** — hero, about, courses (+ detail pages), book store, mentors, gallery, branches/map, contact form.
**Accounts** — password login (student / teacher / management), **Google sign-in**, and **email one-time codes (OTP)** sent with Nodemailer.
**Student portal** — enrollments, class schedule, homework submission, payments & receipts, profile, certificate.
**Teacher workspace** — batches, attendance, homework marking, student progress.
**Admin** — dashboard with charts, courses & batches, enrollments, students, attendance, payments, book orders, messages, people & gallery, homepage/logo CMS.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in DATABASE_URL
npx drizzle-kit push           # create the schema
npx tsx src/db/seed.ts         # demo data (courses, mentors, admin user…)
npm run build && npm start     # http://localhost:3000
```

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Management / admin | admin@lhbd.com | admin123 |
| Management | farhana@lhbd.com | manage123 |
| Teacher (founder) | founder@lhbd.com | founder123 |
| Teacher | teacher@lhbd.com | teacher123 |
| Student | student@lhbd.com | student123 |

---

## Environment

Everything is read from `process.env` (see `.env.example` for the annotated list).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string — **required** |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth client — enables “Continue with Google”. Button hides when unset. |
| `GOOGLE_REDIRECT_URI` | Optional override; defaults to `<request-origin>/api/auth/google/callback` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Nodemailer SMTP transport for OTP emails |
| `SMTP_TLS_INSECURE` | `1` only for self-hosted mailers with self-signed certs |
| `OTP_SECRET` | Salt for stored OTP hashes — set a long random string |
| `OTP_DEV_MODE` | `1` shows the code in the UI when SMTP is missing (staging only) |

---

## Sign-in options

### 1. Google

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
2. Authorised redirect URI: `https://YOUR-DOMAIN/api/auth/google/callback`
   (locally: `http://localhost:3000/api/auth/google/callback`).
3. Copy the client ID/secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

Flow: `/api/auth/google` (state cookie → Google) → `/api/auth/google/callback`
(code exchange → OpenID profile → find-or-create user → session). CSRF-protected via the
`state` cookie; the origin is taken from `X-Forwarded-Host/Proto` so it works behind proxies.

### 2. Email OTP (Nodemailer)

On the login page choose **Email code** → enter address → we mail a 6-digit code.
Codes are stored **hashed** (SHA-256 + `OTP_SECRET`), expire in 10 minutes, allow 5 attempts,
one live code per address (45s resend throttle) and are single-use.

An unknown address provisions a new **student** account on first successful verification
(passwordless — no password is ever set), so the flow doubles as “sign in or sign up”.

Gmail example:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="Language Help BD <you@gmail.com>"
```

---

## Google sign-in & OTP data model

| Table / column | Purpose |
|---|---|
| `users.google_id` (unique, nullable) | Google subject id; linked to an existing account on first Google sign-in |
| `users.password_hash` = `!passwordless:…` | Marks accounts created via Google/OTP — password login can never match them |
| `otp_codes` | `email`, `code_hash`, `expires_at`, `consumed_at`, `attempts`, `created_at` |

---

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm start          # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

---

## Deploy notes

* Set all env vars in your host (Vercel/Railway/Render/Fly/VPS).
* Run `npx drizzle-kit push` against the production database once, then optionally seed.
* Uploaded images are written to `public/uploads` (falls back to data URIs when the
  filesystem is read-only) — move to S3/R2/Cloudinary for heavy production use.
