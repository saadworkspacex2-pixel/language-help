import { requireRole } from '@/lib/session';
import DashShell from '@/components/dash/shell';
import { getContent } from '@/lib/content-server';

const LINKS = [
  { href: '/portal', label: 'Overview', icon: 'dashboard' },
  { href: '/portal/enroll', label: 'Enroll in a Course', icon: 'enroll' },
  { href: '/portal/payments', label: 'Payments', icon: 'payments' },
  { href: '/portal/profile', label: 'My Profile', icon: 'profile' },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const [user, c] = await Promise.all([requireRole('student'), getContent()]);
  return (
    <DashShell name={user.name} roleLabel="Student Portal" idLabel={user.studentId} links={LINKS} brand={{ name: c.brand_name, accent: c.brand_accent, logo: c.brand_logo }}>
      {children}
    </DashShell>
  );
}
