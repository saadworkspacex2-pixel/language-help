import { requireRole } from '@/lib/session';
import DashShell from '@/components/dash/shell';
import { getContent } from '@/lib/content-server';

const LINKS = [
  { href: '/teacher', label: 'Overview', icon: 'dashboard' },
  { href: '/teacher/homework', label: 'Homework', icon: 'homework' },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [user, c] = await Promise.all([requireRole('teacher'), getContent()]);
  return (
    <DashShell name={user.name} roleLabel="Teacher Portal" links={LINKS} brand={{ name: c.brand_name, accent: c.brand_accent, logo: c.brand_logo }}>
      {children}
    </DashShell>
  );
}
