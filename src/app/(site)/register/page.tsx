import Link from 'next/link';
import { registerAction } from '@/lib/actions/auth';
import { Reveal } from '@/components/motion';
import { UserPlus } from 'lucide-react';
import { googleConfigured } from '@/lib/google';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="hero-glow flex min-h-screen items-center justify-center px-6 py-32">
      <Reveal className="w-full max-w-md">
        <div className="glass-strong w-full rounded-[34px] p-8 md:p-10">
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#1A1A1A] text-white shadow-lg">
              <UserPlus size={22} />
            </span>
            <h1 className="mt-5 text-[24px] font-[800] tracking-tight text-[#1A1A1A]">Create your account</h1>
            <p className="mt-1.5 text-[13.5px] text-[#6C757D]">Your student ID will be generated automatically.</p>
          </div>

          {sp.error && (
            <p className="mt-5 rounded-2xl bg-[#E51A24]/[0.07] px-4 py-3 text-center text-[13px] font-[600] text-[#E51A24]">
              {sp.error === 'email' ? 'An account with this email already exists.' : 'Please fill in all required fields.'}
            </p>
          )}

          {googleConfigured() && (
            <>
              <a href="/api/auth/google" className="btn btn-outline btn-md mt-6 w-full gap-2.5 font-[700] text-[#2B2F36]">
                <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.7 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.3 17.7 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-2.8-.4-4.1H24v8.2h12.6c-.3 2.1-1.7 5.2-4.8 7.3l7.7 6c4.6-4.2 6.6-10.3 6.6-17.4z" />
                  <path fill="#FBBC05" d="M10.5 28.7A14.6 14.6 0 0 1 9.7 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
                  <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.6l-7.7-6c-2.1 1.4-4.8 2.4-7.6 2.4-6.3 0-11.6-3.8-13.5-9.1l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
                </svg>
                Sign up with Google
              </a>
              <div className="my-5 flex items-center gap-3">
                <span className="divider-rule flex-1" />
                <span className="text-[10.5px] font-[750] uppercase tracking-[0.18em] text-[#9AA1AB]">or</span>
                <span className="divider-rule flex-1" />
              </div>
            </>
          )}

          <form action={registerAction} className="mt-6 space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input name="name" required className="input" placeholder="Your full name" />
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input name="phone" required className="input" placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input name="email" type="email" required className="input" placeholder="you@email.com" />
            </div>
            <div>
              <label className="label">Password *</label>
              <input name="password" type="password" required minLength={6} className="input" placeholder="At least 6 characters" />
            </div>
            <button className="btn btn-primary btn-lg w-full">Register as Student</button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[#6C757D]">
            Already registered?{' '}
            <Link href="/login" className="font-[700] text-[#E51A24] hover:underline">Log in</Link>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
