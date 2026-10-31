import { requireRole } from '@/lib/session';
import DashShell from '@/components/dash/shell';
import { getContent } from '@/lib/content-server';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/courses', label: 'Courses & Batches', icon: 'courses' },
  { href: '/admin/enrollments', label: 'Enrollments', icon: 'enroll' },
  { href: '/admin/students', label: 'Students', icon: 'students' },
  { href: '/admin/attendance', label: 'Attendance', icon: 'attendance' },
  { href: '/admin/payments', label: 'Payments', icon: 'wallet' },
  { href: '/admin/books', label: 'Book Store', icon: 'courses' },
  { href: '/admin/messages', label: 'Messages', icon: 'notices' },
  { href: '/admin/emails', label: 'Automated Emails', icon: 'mail' },
  { href: '/admin/content', label: 'Homepage & Logo', icon: 'design' },
  { href: '/admin/site', label: 'People & Gallery', icon: 'site' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, c] = await Promise.all([requireRole('management'), getContent()]);
  return (
    <DashShell name={user.name} roleLabel="Management" links={LINKS} brand={{ name: c.brand_name, accent: c.brand_accent, logo: c.brand_logo }}>
      {children}
    </DashShell>
  );
}
