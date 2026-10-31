import Navbar from '@/components/site/navbar';
import Footer from '@/components/site/footer';
import PageTransition from '@/components/page-transition';
import { getSessionUser } from '@/lib/session';
import { getContent } from '@/lib/content-server';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, c] = await Promise.all([getSessionUser(), getContent()]);
  return (
    <>
      <Navbar user={user ? { name: user.name, role: user.role } : null} brand={{ name: c.brand_name, accent: c.brand_accent, logo: c.brand_logo }} />
      <main><PageTransition>{children}</PageTransition></main>
      <Footer />
    </>
  );
}
