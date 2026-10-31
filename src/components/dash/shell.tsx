'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, PlusCircle, CreditCard, User, ClipboardList,
  Users, CalendarCheck, Settings, Image as ImageIcon, Megaphone, LogOut,
  School, Menu, X, Wallet, Layers, UserRound, Palette, Mail,
} from 'lucide-react';
import { logoutAction } from '@/lib/actions/auth';

const ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard, courses: BookOpen, enroll: PlusCircle, payments: CreditCard,
  profile: User, homework: ClipboardList, students: Users, attendance: CalendarCheck,
  settings: Settings, gallery: ImageIcon, notices: Megaphone, wallet: Wallet,
  batches: Layers, people: UserRound, site: School, design: Palette, mail: Mail,
};

type LinkItem = { href: string; label: string; icon: string };

const PANEL = {
  backgroundImage: 'linear-gradient(178deg, rgba(255, 255, 255,.97), rgba(238, 240, 240,.95) 58%, rgba(221, 223, 229,.97))',
  border: '1px solid #BEC0C6',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,.95), inset 0 -2px 0 rgba(107, 107, 113,.14), 0 2px 3px rgba(52, 52, 58,.14), 0 26px 50px -26px rgba(52, 52, 58,.55)',
  backdropFilter: 'blur(16px) saturate(112%)',
  WebkitBackdropFilter: 'blur(16px) saturate(112%)',
} as const;

function BrandLock({ brand }: { brand?: { name: string; accent: string; logo: string } }) {
  if (brand?.logo) {
    /* original logo colours, never inverted — same as the public navbar */
    return (
      <img
        src={brand.logo}
        alt={`${brand.name} ${brand.accent}`}
        className="h-9 w-auto max-w-[188px] object-contain"
        draggable={false}
      />
    );
  }
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-[#A50F17] text-sm font-[800] text-white"
        style={{
          backgroundImage: 'linear-gradient(180deg,#FF525A,#E51A24 52%,#BE121B)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5), inset 0 -2px 0 rgba(23, 23, 29,.4), 0 4px 8px -2px rgba(170,16,26,.55)',
          textShadow: '0 1px 0 rgba(29, 29, 35,.4)',
        }}
      >
        {(brand?.name ?? 'L').slice(0, 1)}
      </span>
      <p className="text-[13.5px] font-[750] tracking-tight text-[#202026]">
        {brand ? `${brand.name} ${brand.accent}` : 'Language Help BD'}
      </p>
    </span>
  );
}

export default function DashShell({
  name, roleLabel, idLabel, links, children, brand,
}: {
  name: string; roleLabel: string; idLabel?: string | null; links: LinkItem[]; children: React.ReactNode;
  brand?: { name: string; accent: string; logo: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {links.map((l) => {
        const Icon = ICONS[l.icon] ?? LayoutDashboard;
        const active = l.href === links[0]?.href ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href} href={l.href} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-[13px] px-3.5 py-2.5 text-[13.5px] font-[650] transition-all duration-300 ${
              active
                ? 'border border-[#121218] text-[#EDEFEF]'
                : 'border border-transparent text-[#54545A] hover:border-[#C6C8CE] hover:text-[#202026] hover:shadow-[inset_0_1px_0_#fff,0_1px_2px_rgba(52, 52, 58,.14)]'
            }`}
            style={
              active
                ? {
                    backgroundImage: 'linear-gradient(180deg,#404046,#26262C 55%,#17171D)',
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,.16), inset 0 -2px 0 rgba(0,0,0,.55), 0 6px 14px -6px rgba(16, 16, 22,.65)',
                    textShadow: '0 1px 0 rgba(0,0,0,.45)',
                  }
                : undefined
            }
          >
            <Icon size={16} className={active ? 'text-[#C6C8CE]' : 'text-[#7D7D83]'} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  const userCard = (
    <div className="border-t border-[#C6C8CE] p-3">
      <div
        className="flex items-center gap-3 rounded-[16px] border border-[#C6C8CE] p-2.5"
        style={{
          backgroundImage: 'linear-gradient(180deg,#F4F6F9,#F3F5F5)',
          boxShadow: 'inset 0 2px 4px rgba(76, 76, 82,.14), inset 0 -1px 0 rgba(255,255,255,.8)',
        }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#A50F17] text-[14px] font-[800] text-white"
          style={{
            backgroundImage: 'linear-gradient(180deg,#FF525A,#E51A24 52%,#BE121B)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), 0 3px 6px -2px rgba(170,16,26,.5)',
          }}
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-[750] text-[#202026]">{name}</p>
          <p className="truncate text-[10.5px] font-[650] text-[#7D7D83]">{idLabel ?? roleLabel}</p>
        </div>
        <form action={logoutAction}>
          <button
            title="Log out"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#C6C8CE] text-[#65656B] shadow-[inset_0_1px_0_#fff] transition hover:text-[#C8151F]"
          >
            <LogOut size={15} />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar — a raised paper panel */}
      <aside
        className="fixed inset-y-4 left-4 z-40 hidden w-64 flex-col rounded-[26px] lg:flex"
        style={PANEL}
      >
        <Link href="/" className="flex items-center gap-2.5 px-4 pt-5 transition-transform duration-300 hover:scale-[1.01]">
          <BrandLock brand={brand} />
        </Link>
        <div className="mx-4 mt-3">
          <p className="rounded-full border border-[#C6C8CE] bg-[#E5E7ED]/70 px-3 py-1 text-center text-[10px] font-[800] uppercase tracking-[0.16em] text-[#C8151F] shadow-[inset_0_1px_0_#fff]">
            {roleLabel}
          </p>
        </div>
        {nav}
        {userCard}
      </aside>

      {/* Mobile top bar */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between border-b border-[#BEC0C6] px-4 py-2.5 lg:hidden"
        style={{
          backgroundImage: 'linear-gradient(178deg, rgba(255, 255, 255,.97), rgba(231, 233, 239,.96))',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.95), 0 4px 12px -6px rgba(52, 52, 58,.45)',
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          {brand?.logo ? (
            <span className="flex h-9 items-center rounded-lg border border-[#BEC0C6] bg-[#FFFFFF] px-2 shadow-[inset_0_1px_0_#fff]">
              <img src={brand.logo} alt="" className="h-6 w-auto max-w-[92px] object-contain" />
            </span>
          ) : (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#A50F17] text-xs font-[800] text-white"
              style={{ backgroundImage: 'linear-gradient(180deg,#FF525A,#E51A24 52%,#BE121B)' }}
            >
              {(brand?.name ?? 'L').slice(0, 1)}
            </span>
          )}
          <span className="text-[13px] font-[750] text-[#202026]">
            {brand ? `${brand.name} ${brand.accent}` : 'LHBD'} <span className="text-[#C8151F]">{roleLabel}</span>
          </span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#BEC0C6] text-[#333339] shadow-[inset_0_1px_0_#fff,0_1px_2px_rgba(52, 52, 58,.14)]"
        >
          <Menu size={18} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#202026]/45 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-3 left-3 flex w-72 flex-col rounded-[26px]"
              style={PANEL}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 pt-5">
                <p className="text-[14px] font-[800] text-[#202026]">Menu</p>
                <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-[#65656B] hover:bg-[#DFE1E7]/70"><X size={17} /></button>
              </div>
              {nav}
              {userCard}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content — top padding is intentionally tight; the sidebar is fixed, not in flow */}
      <main className="px-4 pb-16 pt-4 sm:px-6 lg:ml-72 lg:px-10 lg:pt-6">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
