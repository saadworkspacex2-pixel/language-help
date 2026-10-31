export function dashboardPathFor(role: string): string {
  if (role === 'management') return '/admin';
  if (role === 'teacher') return '/teacher';
  return '/portal';
}
