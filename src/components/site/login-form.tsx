'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { loginAction, requestOtpAction, verifyOtpAction } from '@/lib/actions/auth';
import {
  GraduationCap, Briefcase, BookOpen, LogIn, KeyRound, AtSign,
  MailCheck, ArrowLeft, ShieldCheck, Loader2, Send,
} from 'lucide-react';

const ROLES = [
  { key: 'student', label: 'Student', icon: GraduationCap },
  { key: 'teacher', label: 'Teacher', icon: BookOpen },
  { key: 'management', label: 'Management', icon: Briefcase },
];

const ERRORS: Record<string, string> = {
  invalid: 'Invalid email or password.',
  role: 'This account belongs to a different role — pick the right tab.',
  google_off: 'Google sign-in is not configured yet.',
  google_cancelled: 'Google sign-in was cancelled.',
  google_state: 'The Google sign-in session expired. Please try again.',
  google_token: 'Google did not return a valid token. Please try again.',
  google_profile: 'We could not read your Google profile.',
  google_unverified: 'That Google email is not verified.',
  google_failed: 'Google sign-in failed. Please try again.',
};

function GoogleGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.7 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.3 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-2.8-.4-4.1H24v8.2h12.6c-.3 2.1-1.7 5.2-4.8 7.3l7.7 6c4.6-4.2 6.6-10.3 6.6-17.4z" />
      <path fill="#FBBC05" d="M10.5 28.7A14.6 14.6 0 0 1 9.7 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.6l-7.7-6c-2.1 1.4-4.8 2.4-7.6 2.4-6.3 0-11.6-3.8-13.5-9.1l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function LoginForm({
  initialRole, error, googleEnabled = false,
}: {
  initialRole: string;
  error?: string;
  googleEnabled?: boolean;
}) {
  const [role, setRole] = useState(initialRole);
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const router = useRouter();

  // OTP flow state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const errorText = error ? ERRORS[error] ?? 'Something went wrong. Please try again.' : null;

  async function sendCode(formData: FormData) {
    setNotice(null);
    setDevCode(null);
    const res = await requestOtpAction(formData);
    if (!res.ok) {
      setNotice({ tone: 'err', text: res.message ?? 'Could not send the code.' });
      return;
    }
    setOtpEmail(res.email ?? String(formData.get('email') || ''));
    setOtpSent(true);
    setNotice({ tone: 'ok', text: res.message ?? 'Code sent.' });
    if (res.devCode) setDevCode(res.devCode);
  }

  async function verifyCode(formData: FormData) {
    setNotice(null);
    const res = await verifyOtpAction(formData);
    if (!res.ok || !res.redirectTo) {
      setNotice({ tone: 'err', text: res.message ?? 'That code did not work.' });
      return;
    }
    setNotice({ tone: 'ok', text: 'Signed in — taking you to your dashboard…' });
    startTransition(() => {
      router.push(res.redirectTo as string);
      router.refresh();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong w-full max-w-md rounded-[30px] p-8 md:p-9"
    >
      <div className="text-center">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] border border-[#A50F17] text-xl font-[800] text-white"
          style={{
            backgroundImage: 'linear-gradient(180deg,#FF525A,#E51A24 52%,#BE121B)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5), inset 0 -2px 0 rgba(90,4,9,.4), 0 8px 18px -6px rgba(170,16,26,.6)',
            textShadow: '0 1px 0 rgba(110,6,12,.4)',
          }}
        >
          L
        </span>
        <h1 className="mt-5 text-[24px] font-[800] tracking-tight text-[#16181C]">Welcome back</h1>
        <p className="mt-1.5 text-[13.5px] text-[#6B7280]">Log in to your Language Help BD account</p>
      </div>

      {errorText && (
        <p className="mt-5 rounded-[14px] border border-[#E51A24]/30 bg-[#E51A24]/[0.06] px-4 py-3 text-center text-[13px] font-[650] text-[#C8151F]">
          {errorText}
        </p>
      )}

      {/* ---------- Google ---------- */}
      {googleEnabled ? (
        <>
          <a
            href="/api/auth/google"
            className="btn btn-outline btn-md mt-6 w-full gap-2.5 font-[700] text-[#2B2F36]"
          >
            <GoogleGlyph /> Continue with Google
          </a>
          <div className="my-5 flex items-center gap-3">
            <span className="divider-rule flex-1" />
            <span className="text-[10.5px] font-[750] uppercase tracking-[0.18em] text-[#9AA1AB]">or</span>
            <span className="divider-rule flex-1" />
          </div>
        </>
      ) : (
        <div className="mt-5" />
      )}

      {/* ---------- Mode switch ---------- */}
      <div className="grid grid-cols-2 gap-1.5 rounded-[16px] border border-[#E3E5EA] bg-[#F4F6F8] p-1.5 shadow-[inset_0_2px_4px_rgba(15,23,42,.06)]">
        {[
          { key: 'password' as const, label: 'Password' },
          { key: 'code' as const, label: 'Email code' },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => { setMode(m.key); setNotice(null); }}
            className={`rounded-[11px] px-3 py-2 text-[12.5px] font-[750] transition-all duration-300 ${
              mode === m.key
                ? 'border border-[#DDE1E7] bg-white text-[#C8151F] shadow-[inset_0_1px_0_#fff,0_2px_5px_rgba(15,23,42,.10)]'
                : 'text-[#6B7280] hover:text-[#16181C]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ---------- Password login ---------- */}
      {mode === 'password' && (
        <>
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-[16px] border border-[#E3E5EA] bg-[#F4F6F8] p-1.5 shadow-[inset_0_2px_4px_rgba(15,23,42,.06)]">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={`flex flex-col items-center gap-1 rounded-[11px] px-2 py-2.5 text-[11.5px] font-[750] transition-all duration-300 ${
                  role === r.key
                    ? 'border border-[#DDE1E7] bg-white text-[#C8151F] shadow-[inset_0_1px_0_#fff,0_2px_5px_rgba(15,23,42,.10)]'
                    : 'text-[#6B7280] hover:text-[#16181C]'
                }`}
              >
                <r.icon size={16} />
                {r.label}
              </button>
            ))}
          </div>

          <form action={loginAction} className="mt-5 space-y-4">
            <input type="hidden" name="role" value={role} />
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A7AEB8]" />
                <input name="email" type="email" required className="input pl-10" placeholder="you@email.com" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A7AEB8]" />
                <input name="password" type="password" required className="input pl-10" placeholder="••••••••" />
              </div>
            </div>
            <button className="btn btn-dark btn-lg w-full gap-2">
              <LogIn size={16} /> Log in as {ROLES.find((r) => r.key === role)?.label}
            </button>
          </form>
        </>
      )}

      {/* ---------- Email OTP login ---------- */}
      {mode === 'code' && (
        <div className="mt-5">
          {!otpSent ? (
            <form
              action={sendCode}
              className="space-y-4"
            >
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A7AEB8]" />
                  <input name="email" type="email" required className="input pl-10" placeholder="you@email.com" />
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-[#8B93A0]">
                  We’ll email you a 6-digit code — no password needed. New here? This also creates your student account.
                </p>
              </div>
              <button className="btn btn-primary btn-lg w-full gap-2">
                <Send size={15} /> Email me a code
              </button>
            </form>
          ) : (
            <form action={verifyCode} className="space-y-4">
              <input type="hidden" name="email" value={otpEmail} />
              <div>
                <label className="label">6-digit code</label>
                <div className="relative">
                  <ShieldCheck size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A7AEB8]" />
                  <input
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    autoFocus
                    className="input pl-10 text-center text-[20px] font-[800] tracking-[0.5em]"
                    placeholder="000000"
                  />
                </div>
              </div>
              <button disabled={pending} className="btn btn-primary btn-lg w-full gap-2 disabled:opacity-70">
                {pending ? <Loader2 size={16} className="animate-spin" /> : <MailCheck size={16} />}
                Verify &amp; sign in
              </button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setNotice(null); setDevCode(null); }}
                className="flex w-full items-center justify-center gap-1.5 text-[12.5px] font-[700] text-[#6B7280] hover:text-[#C8151F]"
              >
                <ArrowLeft size={13} /> Use a different email
              </button>
            </form>
          )}

          {notice && (
            <p
              className={`mt-4 rounded-[14px] border px-4 py-3 text-center text-[12.5px] font-[650] ${
                notice.tone === 'ok'
                  ? 'border-[#2F6B3D]/30 bg-[#2F6B3D]/[0.07] text-[#25603A]'
                  : 'border-[#E51A24]/30 bg-[#E51A24]/[0.06] text-[#C8151F]'
              }`}
            >
              {notice.text}
            </p>
          )}

          {devCode && (
            <p className="mt-2 rounded-[14px] border border-dashed border-[#C9D0D9] px-4 py-3 text-center text-[12.5px] font-[700] text-[#4C525A]">
              Dev code: <span className="tracking-[0.3em] text-[#16181C]">{devCode}</span>
            </p>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-[13px] text-[#6B7280]">
        New student?{' '}
        <Link href="/register" className="font-[750] text-[#C8151F] hover:underline">Create an account</Link>
      </p>
      <p className="mt-4 rounded-[14px] border border-[#E3E5EA] bg-[#F8F9FA] px-4 py-3 text-center text-[11px] leading-relaxed text-[#A7AEB8]">
        Demo — student: student@lhbd.com / student123 · teacher: teacher@lhbd.com / teacher123 · management: admin@lhbd.com / admin123
      </p>
    </motion.div>
  );
}
