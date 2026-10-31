import { db } from '@/db';
import { branches, galleryItems, notices, settings, users } from '@/db/schema';
import { and, desc, eq, or } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import SiteManager from '@/components/admin/site-manager';

export const dynamic = 'force-dynamic';

export default async function AdminSitePage() {
  await requireRole('management');
  const [people, noticeList, gallery, branchList, settingRows] = await Promise.all([
    db.select().from(users).where(and(or(eq(users.role, 'teacher'), eq(users.role, 'management')), eq(users.showOnSite, true))),
    db.select().from(notices).orderBy(desc(notices.id)),
    db.select().from(galleryItems).orderBy(desc(galleryItems.id)),
    db.select().from(branches),
    db.select().from(settings),
  ]);

  const settingsMap: Record<string, string> = {};
  for (const s of settingRows) settingsMap[s.key] = s.value ?? '';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">CMS</p>
        <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
          Website <span className="font-serif-accent font-normal italic text-[#6C757D]">content.</span>
        </h1>
        <p className="mt-2 text-[13px] text-[#6C757D]">Everything the public sees — people, notices, gallery, branches and contact info.</p>
      </div>
      <SiteManager
        people={people.map((p) => ({
          id: p.id, name: p.name, email: p.email, role: p.role, phone: p.phone,
          experience: p.experience, bio: p.bio, degrees: p.degrees,
          studyBackground: p.studyBackground, age: p.age, isFounder: p.isFounder,
          profileImage: p.profileImage, profileGallery: p.profileGallery,
        }))}
        notices={noticeList}
        gallery={gallery}
        branches={branchList}
        settingsMap={settingsMap}
      />
    </div>
  );
}
