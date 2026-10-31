'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ArrowUpRight, LayoutDashboard } from 'lucide-react';
import { dashboardPathFor as dashboardPath } from '@/lib/nav-shared';

const links = [
  { href: '/', label: 'Home' },
  { href: '/#about', label: 'About' },
  { href: '/courses', label: 'Courses' },
  { href: '/books', label: 'Books' },
  { href: '/#people', label: 'People' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Brand lockup.
 * The uploaded logo is ALWAYS rendered in its original colours — no invert /
 * brightness filter at any scroll position. When there is no uploaded logo we
 * fall back to the pressed-enamel “L” tile, which reads on paper either way.
 */
function BrandMark({ brand }: { brand: { name: string; accent: string; logo: string } }) {
  if (brand.logo) {
    return (
      /* the uploaded logo keeps its original colours at every scroll position */
      <img
        src={brand.logo}
        alt={`${brand.name} ${brand.accent}`}
        className="h-8 w-auto max-w-[168px] object-contain sm:h-9 sm:max-w-[204px]"
        draggable={false}
      />
    );
  }
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="relative flex h-9 w-9 items-center justify-center rounded-[11px] border border-[#A50F17] text-[15px] font-[800] text-white"
        style={{
          backgroundImage: 'linear-gradient(180deg,#FF525A,#E51A24 52%,#BE121B)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,.5), inset 0 -2px 0 rgba(23, 23, 29,.4), 0 4px 8px -2px rgba(170,16,26,.55)',
          textShadow: '0 1px 0 rgba(29, 29, 35,.4)',
        }}
      >
        {brand.name.slice(0, 1)}
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-[#77777D] brass animate-pulse-dot" />
      </span>
      <span className="text-[15px] font-[750] tracking-tight text-[#202026]">
        {brand.name} <span className="text-[#E51A24]">{brand.accent}</span>
      </span>
    </span>
  );
}

export default function Navbar({
  user,
  brand,
}: {
  user: { name: string; role: string } | null;
  brand: { name: string; accent: string; logo: string };
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      {/* ---------- Dynamic island ---------- */}
      <div
        className={`relative flex w-full max-w-6xl items-center justify-between rounded-full py-2 pl-3 pr-2 transition-all duration-500 ${
          scrolled ? 'shadow-[0_2px_3px_rgba(52, 52, 58,.16),0_18px_36px_-16px_rgba(52, 52, 58,.55)]' : 'shadow-[0_2px_3px_rgba(52, 52, 58,.12),0_14px_28px_-14px_rgba(52, 52, 58,.45)]'
        }`}
        style={{
          backgroundImage:
            'linear-gradient(178deg, rgba(255, 255, 255,.96), rgba(238, 240, 240,.93) 58%, rgba(223, 225, 231,.95))',
          border: '1px solid #BEC0C6',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,.95), inset 0 -2px 0 rgba(107, 107, 113,.14), 0 2px 3px rgba(52, 52, 58,.14), 0 20px 40px -20px rgba(52, 52, 58,.5)',
          backdropFilter: 'blur(16px) saturate(112%)',
          WebkitBackdropFilter: 'blur(16px) saturate(112%)',
        }}
      >
        <Link href="/" className="group flex shrink-0 items-center transition-transform duration-500 hover:scale-[1.02]">
          <BrandMark brand={brand} />
        </Link>

        {/* Recessed track holding the nav keys */}
        <nav
          className="hidden items-center gap-0.5 rounded-full px-1.5 py-1 lg:flex"
          style={{
            backgroundImage: 'linear-gradient(180deg,#ECEFF3,#F7F9FA)',
            boxShadow: 'inset 0 2px 4px rgba(76, 76, 82,.18), inset 0 -1px 0 rgba(255,255,255,.8)',
            border: '1px solid rgba(190, 192, 198,.8)',
          }}
        >
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.label}
                href={l.href}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-[600] transition-all duration-300 ${
                  active
                    ? 'text-[#F5F7F7]'
                    : 'text-[#54545A] hover:text-[#202026] hover:shadow-[inset_0_1px_0_#fff,0_1px_2px_rgba(52, 52, 58,.14)]'
                }`}
                style={
                  active
                    ? {
                        backgroundImage: 'linear-gradient(180deg,#404046,#26262C 55%,#17171D)',
                        boxShadow:
                          'inset 0 1px 0 rgba(255,255,255,.16), inset 0 -2px 0 rgba(0,0,0,.55), 0 3px 6px -2px rgba(16, 16, 22,.5)',
                        textShadow: '0 1px 0 rgba(0,0,0,.45)',
                      }
                    : undefined
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <Link href={dashboardPath(user.role)} className="btn btn-dark btn-sm hidden gap-1.5 sm:inline-flex">
              <LayoutDashboard size={14} /> Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn btn-outline btn-sm hidden sm:inline-flex">
              Log in
            </Link>
          )}
          <Link href="/courses" className="btn btn-primary btn-sm hidden gap-1 sm:inline-flex">
            Enroll Now <ArrowUpRight size={14} />
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className="btn btn-outline flex h-9 w-9 shrink-0 items-center justify-center !p-0 text-[#333339] lg:hidden"
            aria-label="Menu"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* ---------- Mobile drawer ---------- */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-4 top-[80px] rounded-[28px] border border-[#BEC0C6] p-4 lg:hidden"
            style={{
              backgroundImage: 'linear-gradient(178deg,#FFFFFF,#F7F9FA 60%,#ECEFF3)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.95), 0 2px 4px rgba(52, 52, 58,.14), 0 30px 50px -22px rgba(52, 52, 58,.6)',
            }}
          >
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="rounded-2xl px-4 py-2.5 text-sm font-[650] text-[#333339] transition hover:bg-[#DFE1E7]/70 hover:shadow-[inset_0_1px_0_#fff]"
                >
                  {l.label}
                </Link>
              ))}
              <div className="divider-rule my-2" />
              <div className="flex gap-2">
                {user ? (
                  <Link href={dashboardPath(user.role)} className="btn btn-dark btn-md flex-1">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/login" className="btn btn-outline btn-md flex-1">
                    Log in
                  </Link>
                )}
                <Link href="/courses" className="btn btn-primary btn-md flex-1">
                  Enroll Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
