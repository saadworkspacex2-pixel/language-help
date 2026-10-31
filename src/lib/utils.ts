export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function tk(amount: number | null | undefined): string {
  return '৳' + (amount ?? 0).toLocaleString('en-IN');
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')) : d;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function effectiveFee(course: { fee: number; offerFee: number | null }): number {
  return course.offerFee ?? course.fee;
}

export function totalDue(course: { fee: number; offerFee: number | null; bookFee: number }): number {
  return effectiveFee(course) + course.bookFee;
}

export function genStudentId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LHBD-${year}-${rand}`;
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function statusColor(s: string): string {
  switch (s) {
    case 'confirmed': case 'completed': case 'present': case 'marked': case 'issued':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'pending': case 'upcoming': case 'late': case 'scheduled': case 'new':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'rejected': case 'cancelled': case 'absent':
      return 'bg-red-50 text-red-700 ring-red-200';
    case 'postponed': case 'running': case 'contacted': case 'submitted':
      return 'bg-sky-50 text-sky-700 ring-sky-200';
    default:
      return 'bg-gray-100 text-gray-600 ring-gray-200';
  }
}
