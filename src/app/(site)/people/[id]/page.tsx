import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { courses, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Reveal, ScaleIn } from '@/components/motion';
import { ArrowLeft, ArrowUpRight, BadgeCheck, Cake, GraduationCap, History, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = (await db.select().from(users).where(eq(users.id, Number(id))).limit(1))[0];
  if (!person || !person.showOnSite) notFound();

  const taught = await db.select().from(courses).where(eq(courses.teacherId, person.id));
  const roleLabel = person.isFounder ? 'Founder & Chief Mentor' : person.role === 'management' ? 'Management Team' : 'Language Mentor';

  return (
    <div className="hero-glow min-h-screen pt-36 md:pt-44">
      <div className="mx-auto max-w-6xl px-6 pb-28">
        <Reveal>
          <Link href="/#people" className="inline-flex items-center gap-2 text-[13px] font-[650] text-[#6C757D] transition hover:text-[#1A1A1A]">
            <ArrowLeft size={15} /> Back to people
          </Link>
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Profile card */}
          <ScaleIn>
            <div className="glass-strong overflow-hidden rounded-[34px] lg:sticky lg:top-32">
              <div className="relative">
                {person.profileImage ? (
                  <img src={person.profileImage} alt={person.name} className="h-96 w-full object-cover" />
                ) : (
                  <div className="flex h-96 w-full items-center justify-center bg-[#1A1A1A] text-6xl font-[800] text-white">{person.name[0]}</div>
                )}
                {person.isFounder && (
                  <span className="glass absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-[700] text-[#1A1A1A]">
                    <BadgeCheck size={14} className="text-[#E51A24]" /> Founder
                  </span>
                )}
              </div>
              <div className="p-7">
                <h1 className="text-[26px] font-[800] tracking-tight text-[#1A1A1A]">{person.name}</h1>
                <p className="mt-1 text-[14px] font-[650] text-[#E51A24]">{roleLabel}</p>
                <div className="mt-5 space-y-3">
                  {person.experience && (
                    <div className="flex items-center gap-3 rounded-2xl bg-[#F8F9FA] px-4 py-3 text-[13px] font-[600] text-[#495057]">
                      <History size={15} className="shrink-0 text-[#E51A24]" /> {person.experience}
                    </div>
                  )}
                  {person.age && (
                    <div className="flex items-center gap-3 rounded-2xl bg-[#F8F9FA] px-4 py-3 text-[13px] font-[600] text-[#495057]">
                      <Cake size={15} className="shrink-0 text-[#E51A24]" /> Age {person.age}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScaleIn>

          {/* Details */}
          <div className="space-y-8">
            {person.bio && (
              <Reveal>
                <div className="rounded-[30px] bg-white p-8 shadow-[0_12px_44px_rgba(26,26,26,0.07)] ring-1 ring-black/[0.05]">
                  <h2 className="flex items-center gap-2.5 text-[20px] font-[800] tracking-tight"><ShieldCheck size={19} className="text-[#E51A24]" /> About</h2>
                  <p className="mt-4 whitespace-pre-line text-[14.5px] leading-[1.85] text-[#495057]">{person.bio}</p>
                </div>
              </Reveal>
            )}

            {(person.degrees || person.studyBackground) && (
              <Reveal>
                <div className="rounded-[30px] bg-white p-8 shadow-[0_12px_44px_rgba(26,26,26,0.07)] ring-1 ring-black/[0.05]">
                  <h2 className="flex items-center gap-2.5 text-[20px] font-[800] tracking-tight"><GraduationCap size={19} className="text-[#E51A24]" /> Education</h2>
                  <div className="mt-5 space-y-3">
                    {person.degrees?.split('\n').filter(Boolean).map((d) => (
                      <div key={d} className="flex items-start gap-3 rounded-2xl bg-[#F8F9FA] px-4 py-3.5">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#E51A24]" />
                        <p className="text-[13.5px] font-[600] leading-relaxed text-[#495057]">{d}</p>
                      </div>
                    ))}
                    {person.studyBackground && (
                      <p className="pt-1 text-[13.5px] leading-relaxed text-[#6C757D]">{person.studyBackground}</p>
                    )}
                  </div>
                </div>
              </Reveal>
            )}

            {taught.length > 0 && (
              <Reveal>
                <div>
                  <h2 className="text-[20px] font-[800] tracking-tight">Courses by {person.name.split(' ')[0]}</h2>
                  <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                    {taught.map((c) => (
                      <Link key={c.id} href={`/courses/${c.slug}`} className="group card-hover flex items-center justify-between rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]">
                        <div>
                          <p className="text-[14.5px] font-[750] tracking-tight text-[#1A1A1A] group-hover:text-[#E51A24]">{c.title}</p>
                          <p className="mt-0.5 text-[12px] font-[550] text-[#ADB5BD]">{c.level}</p>
                        </div>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F3F5] text-[#1A1A1A] transition group-hover:bg-[#E51A24] group-hover:text-white">
                          <ArrowUpRight size={15} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {person.profileGallery && person.profileGallery.length > 0 && (
              <Reveal>
                <div>
                  <h2 className="text-[20px] font-[800] tracking-tight">Gallery</h2>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {person.profileGallery.map((g, i) => (
                      <div key={i} className="overflow-hidden rounded-3xl shadow-[0_12px_36px_rgba(26,26,26,0.1)]">
                        <img src={g} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-[900ms] hover:scale-105" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
