import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, Briefcase } from 'lucide-react';
import { Reveal } from '@/components/motion';
import type { User } from '@/db/schema';
import type { SiteContent } from '@/lib/content';

function Avatar({ src, name, className }: { src: string | null; name: string; className?: string }) {
  if (src) return <img src={src} alt={name} className={`object-cover ${className ?? ''}`} />;
  return (
    <div className={`flex items-center justify-center bg-[#26262C] font-[800] text-[#EDEFEF] ${className ?? ''}`}>
      {name.slice(0, 1)}
    </div>
  );
}

const paperPlate = {
  backgroundImage: 'linear-gradient(178deg,#FFFFFF,#F7F9FA 62%,#ECEFF3)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.95), 0 1px 2px rgba(52, 52, 58,.14), 0 16px 30px -18px rgba(52, 52, 58,.6)',
} as const;

export default function PeopleSection({ founder, teachers, management, c }: { founder: User | null; teachers: User[]; management: User[]; c: SiteContent }) {
  return (
    <section id="people" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/60" />
      <div className="mx-auto max-w-7xl px-6">
        <Reveal><p className="eyebrow text-center">{c.people_eyebrow}</p></Reveal>
        <Reveal delay={0.08}>
          <h2 className="mx-auto mt-5 max-w-2xl text-center text-[clamp(2rem,4.4vw,3.4rem)] font-[800] leading-[1.05] tracking-[-0.03em] text-[#202026]">
            {c.people_title}
            <span className="font-serif-accent font-normal italic tracking-normal text-[#E51A24]"> {c.people_title_accent}</span>
          </h2>
        </Reveal>

        {/* Founder */}
        {founder && (
          <Reveal delay={0.12}>
            <Link href={`/people/${founder.id}`} className="group mx-auto mt-16 block max-w-4xl">
              <div className="card-hover grid overflow-hidden rounded-[30px] border border-[#C2C4CA] md:grid-cols-[0.85fr_1.15fr]" style={paperPlate}>
                <div className="relative p-2.5 md:p-3">
                  <div className="relative h-72 overflow-hidden rounded-[16px] border border-[#BBBDC3] md:h-full">
                    <Avatar src={founder.profileImage} name={founder.name} className="h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]" />
                    <span
                      className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-[#BEC0C6] px-3 py-1 text-[11px] font-[750] text-[#333339]"
                      style={{ backgroundImage: 'linear-gradient(180deg,#FFFFFF,#F4F6F9)', boxShadow: 'inset 0 1px 0 #fff, 0 2px 4px rgba(31, 31, 37,.3)' }}
                    >
                      <BadgeCheck size={13} className="text-[#C8151F]" /> Founder
                    </span>
                  </div>
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <h3 className="text-[26px] font-[800] tracking-tight text-[#202026] transition-colors group-hover:text-[#C8151F]">{founder.name}</h3>
                  <p className="mt-1 text-[13.5px] font-[700] text-[#C8151F]">Founder &amp; Chief Mentor</p>
                  <p className="mt-4 line-clamp-3 text-[14px] leading-relaxed text-[#65656B]">{founder.bio}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-dashed border-[#ACAEB4] pt-5">
                    <p className="text-[12.5px] font-[650] text-[#7D7D83]">{founder.experience}</p>
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#121218] text-[#EDEFEF] transition-all duration-500 group-hover:border-[#A50F17]"
                      style={{
                        backgroundImage: 'linear-gradient(180deg,#404046,#26262C 55%,#17171D)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.16), inset 0 -2px 0 rgba(0,0,0,.55), 0 6px 12px -6px rgba(16, 16, 22,.65)',
                      }}
                    >
                      <ArrowUpRight size={16} className="transition-transform duration-500 group-hover:rotate-45" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>
        )}

        {/* Teachers */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {teachers.map((t, i) => (
            <Reveal key={t.id} delay={0.06 * i}>
              <Link href={`/people/${t.id}`} className="group block">
                <div className="card-hover overflow-hidden rounded-[24px] border border-[#C2C4CA]" style={paperPlate}>
                  <div className="p-2.5 pb-0">
                    <div className="h-56 overflow-hidden rounded-[15px] border border-[#BBBDC3]">
                      <Avatar src={t.profileImage} name={t.name} className="h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]" />
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="text-[15.5px] font-[750] tracking-tight text-[#202026] transition-colors group-hover:text-[#C8151F]">{t.name}</h4>
                    <p className="text-[12px] font-[700] text-[#C8151F]">Language Mentor</p>
                    <p className="mt-1.5 text-[12px] font-[600] text-[#7D7D83]">{t.experience}</p>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* Management */}
        {management.length > 0 && (
          <>
            <Reveal delay={0.08}>
              <div className="mt-20 flex items-center gap-4">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[#77777D] text-[#2C2C32]"
                  style={{ backgroundImage: 'linear-gradient(180deg,#DDE2E9,#B4BBC5 58%,#8B93A0)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.65), 0 3px 6px -2px rgba(66, 66, 72,.5)' }}
                >
                  <Briefcase size={15} />
                </span>
                <h3 className="text-[19px] font-[800] tracking-tight text-[#202026]">Management Team</h3>
                <div className="divider-rule flex-1" />
              </div>
            </Reveal>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {management.map((m, i) => (
                <Reveal key={m.id} delay={0.05 * i}>
                  <Link href={`/people/${m.id}`} className="group">
                    <div className="card-hover glass-soft flex items-center gap-4 rounded-[22px] p-4">
                      <Avatar src={m.profileImage} name={m.name} className="h-14 w-14 rounded-[14px] border border-[#BBBDC3] text-lg" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-[750] tracking-tight text-[#202026] transition-colors group-hover:text-[#C8151F]">{m.name}</p>
                        <p className="text-[11.5px] font-[650] text-[#65656B]">{m.experience || 'Management'}</p>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
