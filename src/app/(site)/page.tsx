import { db } from '@/db';
import { courses, users, galleryItems, branches } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import Hero from '@/components/site/hero';
import AboutSection from '@/components/site/about-section';
import CoursesSection from '@/components/site/courses-section';
import WhyChoose from '@/components/site/why-choose';
import PeopleSection from '@/components/site/people-section';
import GallerySection from '@/components/site/gallery-section';
import BranchesSection from '@/components/site/branches-section';
import ContactSection from '@/components/site/contact-section';
import { getContent } from '@/lib/content-server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [allCourses, people, gallery, branchList, c] = await Promise.all([
    db.select().from(courses).where(eq(courses.active, true)).orderBy(courses.id),
    db.select().from(users).where(eq(users.showOnSite, true)),
    db.select().from(galleryItems).orderBy(desc(galleryItems.id)),
    db.select().from(branches).orderBy(branches.id),
    getContent(),
  ]);

  const teachers = new Map(people.map((p) => [p.id, p]));
  const founder = people.find((p) => p.isFounder) ?? null;
  const mentors = people.filter((p) => p.role === 'teacher' && !p.isFounder);
  const management = people.filter((p) => p.role === 'management');

  return (
    <>
      <Hero c={c} />
      <AboutSection c={c} />
      <CoursesSection courses={allCourses} teachers={teachers} c={c} />
      <PeopleSection founder={founder} teachers={mentors} management={management} c={c} />
      <WhyChoose c={c} />
      <GallerySection items={gallery} c={c} />
      <BranchesSection items={branchList} c={c} />
      <ContactSection />
    </>
  );
}
