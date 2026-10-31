'use client';

import { motion } from 'framer-motion';
import { markMessageRead } from '@/lib/actions/people';
import { formatDate } from '@/lib/utils';
import {
  AlertTriangle, BadgeCheck, Bell, CalendarClock, CreditCard, Info, Megaphone, XCircle,
} from 'lucide-react';

type Msg = {
  id: number; title: string; body: string; category: string; tone: string;
  readAt: Date | null; createdAt: Date;
};

const TONE: Record<string, { ring: string; chip: string; icon: React.ElementType }> = {
  success: { ring: 'ring-emerald-200', chip: 'bg-emerald-100 text-emerald-700', icon: BadgeCheck },
  warning: { ring: 'ring-amber-200', chip: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  danger: { ring: 'ring-red-200', chip: 'bg-red-100 text-red-700', icon: XCircle },
  info: { ring: 'ring-black/[0.05]', chip: 'bg-sky-100 text-sky-700', icon: Info },
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  enrollment: BadgeCheck, payment: CreditCard, class: CalendarClock,
  notice: Megaphone, certificate: BadgeCheck, update: Bell,
};

export default function NotificationFeed({ messages }: { messages: Msg[] }) {
  const unread = messages.filter((m) => !m.readAt).length;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <h2 className="flex items-center gap-2 text-[18px] font-[800] tracking-tight">
          <Bell size={17} className="text-[#E51A24]" /> Updates
        </h2>
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="rounded-full bg-[#E51A24] px-2.5 py-0.5 text-[10.5px] font-[800] text-white"
          >
            {unread} new
          </motion.span>
        )}
      </div>

      <div className="space-y-3">
        {messages.map((m, i) => {
          const tone = TONE[m.tone] ?? TONE.info;
          const Icon = CATEGORY_ICON[m.category] ?? Bell;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: Math.min(i * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
              className={`glass rounded-[22px] p-5 ring-1 transition-all duration-500 hover:-translate-y-0.5 ${tone.ring} ${
                !m.readAt ? 'border-l-[3px] border-l-[#E51A24]' : 'opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${tone.chip}`}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-[800] tracking-tight text-[#1A1A1A]">{m.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-[750] uppercase tracking-wide ${tone.chip}`}>{m.category}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6C757D]">{m.body}</p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="text-[10.5px] font-[650] text-[#ADB5BD]">{formatDate(m.createdAt)}</span>
                    {!m.readAt && (
                      <form action={markMessageRead}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className="text-[10.5px] font-[750] text-[#E51A24] hover:underline">Mark as read</button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {!messages.length && (
          <p className="glass rounded-[22px] p-8 text-center text-[13px] text-[#ADB5BD]">
            No updates yet — enrollment, class and payment news will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
