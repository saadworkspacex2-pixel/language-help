import Link from 'next/link';
import { MapPin, Phone, Mail, MessageCircle, ArrowUpRight } from 'lucide-react';
import { getSiteInfo } from '@/lib/actions/public';
import { getContent } from '@/lib/content-server';

export default async function Footer() {
  const [info, c] = await Promise.all([getSiteInfo(), getContent()]);
  return (
    <footer className="relative px-4 pb-6 pt-4 sm:px-6">
      <div
        className="relative overflow-hidden rounded-[32px] border border-[#0C0C12] text-[#EDEFEF]"
        style={{
          backgroundImage:
            'radial-gradient(48rem 26rem at 78% -10%, rgba(229,26,36,.16), transparent 62%), radial-gradient(36rem 22rem at 4% 110%, rgba(154, 156, 162,.14), transparent 60%), linear-gradient(178deg,#333339,#24242A 58%,#17171D)',
          boxShadow:
            'inset 0 2px 0 rgba(255,255,255,.12), inset 0 -3px 0 rgba(0,0,0,.55), 0 30px 60px -30px rgba(22, 22, 28,.8)',
        }}
      >
        <div className="pointer-events-none absolute inset-3 rounded-[24px] border border-dashed border-[#79797F]/40" />

        <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-16 sm:px-10">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                {c.brand_logo ? (
                  <span className="flex h-12 items-center rounded-xl border border-[#79797F] bg-[#FFFFFF] px-2.5 shadow-[inset_0_1px_0_#fff,0_2px_6px_rgba(0,0,0,.5)]">
                    {/* logo keeps its original colours on the dark leather too */}
                    <img src={c.brand_logo} alt={c.brand_name} className="h-9 w-auto max-w-[170px] object-contain" />
                  </span>
                ) : (
                  <>
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#77777D] text-base font-[800] text-[#2C2C32]"
                      style={{
                        backgroundImage: 'linear-gradient(180deg,#DDE2E9,#B4BBC5 58%,#8B93A0)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7), 0 4px 10px -4px rgba(0,0,0,.7)',
                      }}
                    >
                      {c.brand_name.slice(0, 1)}
                    </span>
                    <span className="text-lg font-[750] tracking-tight text-[#EDEFEF]">{c.brand_name} <span className="text-[#E51A24]">{c.brand_accent}</span></span>
                  </>
                )}
              </Link>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#A7A9AF]">{c.footer_tagline}</p>
              <a
                href={`https://wa.me/${info.whatsapp}`}
                target="_blank"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#404046] px-4 py-2 text-xs font-[650] text-[#D7D9DF] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] transition hover:border-[#79797F] hover:text-white"
              >
                <MessageCircle size={14} className="text-[#C6C8CE]" /> Chat on WhatsApp
              </a>
            </div>

            <div>
              <p className="text-xs font-[750] uppercase tracking-[0.18em] text-[#8A8C92]">Explore</p>
              <ul className="mt-4 space-y-2.5 text-sm text-[#AFB1B7]">
                <li><Link className="transition hover:text-white" href="/#about">About Us</Link></li>
                <li><Link className="transition hover:text-white" href="/courses">Courses</Link></li>
                <li><Link className="transition hover:text-white" href="/books">Books</Link></li>
                <li><Link className="transition hover:text-white" href="/gallery">Gallery</Link></li>
                <li><Link className="transition hover:text-white" href="/contact">Contact</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-[750] uppercase tracking-[0.18em] text-[#8A8C92]">Contact</p>
              <ul className="mt-4 space-y-3 text-sm text-[#AFB1B7]">
                <li className="flex items-start gap-2.5"><MapPin size={15} className="mt-0.5 shrink-0 text-[#E51A24]" />{info.address}</li>
                <li className="flex items-center gap-2.5"><Phone size={15} className="shrink-0 text-[#E51A24]" />{info.phone}</li>
                <li className="flex items-center gap-2.5"><Mail size={15} className="shrink-0 text-[#E51A24]" />{info.email}</li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-[750] uppercase tracking-[0.18em] text-[#8A8C92]">Start here</p>
              <Link
                href="/register"
                className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#404046] px-4 py-3 text-sm font-[700] text-[#EDEFEF] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] transition hover:border-[#79797F]"
              >
                Create an account
                <ArrowUpRight size={15} className="text-[#C6C8CE]" />
              </Link>
              <Link href="/login" className="btn btn-primary btn-md mt-3 w-full">Log in</Link>
            </div>
          </div>

          <div className="mt-14 select-none overflow-hidden">
            <p className="whitespace-nowrap text-center text-[13vw] font-[800] leading-none tracking-[-0.04em] text-[#EDEFEF]/[0.05]">
              {(c.brand_name + ' ' + c.brand_accent).toUpperCase()}
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#404046]/70 pt-6 text-xs text-[#8A8C92] md:flex-row">
            <p>© {new Date().getFullYear()} Language Help BD. All rights reserved.</p>
            <Link href="/register" className="group inline-flex items-center gap-1 transition hover:text-white">
              Start learning today <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
