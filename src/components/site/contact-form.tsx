'use client';

import { useState } from 'react';
import { submitContact } from '@/lib/actions/public';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';

const panel = {
  backgroundImage: 'linear-gradient(178deg,#FFFFFF,#F7F9FA 62%,#ECEFF3)',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,.95), inset 0 -2px 0 rgba(107, 107, 113,.12), 0 2px 4px rgba(52, 52, 58,.12), 0 26px 46px -26px rgba(52, 52, 58,.6)',
} as const;

export default function ContactForm() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    const fd = new FormData(e.currentTarget);
    const res = await submitContact(fd);
    setState(res.ok ? 'done' : 'error');
  }

  if (state === 'done') {
    return (
      <div className="stitch flex h-full min-h-[320px] flex-col items-center justify-center rounded-[26px] border border-[#C2C4CA] p-10 text-center" style={panel}>
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full border border-[#2F6B3D] text-[#1E4A29]"
          style={{
            backgroundImage: 'linear-gradient(180deg,#B7E6C1,#7FCB90 58%,#4E9E62)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7), inset 0 -2px 0 rgba(20,70,35,.35), 0 8px 16px -8px rgba(30,90,50,.6)',
          }}
        >
          <CheckCircle2 size={28} />
        </span>
        <p className="mt-5 text-[18px] font-[750] tracking-tight text-[#202026]">Message received</p>
        <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-[#65656B]">
          Thanks for reaching out. Our management team will get back to you soon — usually within a working day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handle} className="rounded-[26px] border border-[#C2C4CA] p-7 md:p-8" style={panel}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Your Name *</label>
          <input name="name" required className="input" placeholder="Full name" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" placeholder="01XXXXXXXXX" />
        </div>
      </div>
      <div className="mt-4">
        <label className="label">Email</label>
        <input name="email" type="email" className="input" placeholder="you@email.com" />
      </div>
      <div className="mt-4">
        <label className="label">Message *</label>
        <textarea name="message" required rows={4} className="input resize-none" placeholder="Tell us which course you're interested in, or ask anything…" />
      </div>
      {state === 'error' && <p className="mt-3 text-[13px] font-[650] text-[#C8151F]">Something went wrong — please try again.</p>}
      <button disabled={state === 'loading'} className="btn btn-primary btn-md mt-6 w-full gap-2 disabled:opacity-70">
        {state === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
        Send Message
      </button>
      <p className="mt-3 text-center text-[11.5px] text-[#7D7D83]">Delivered directly to LHBD management &amp; email.</p>
    </form>
  );
}
