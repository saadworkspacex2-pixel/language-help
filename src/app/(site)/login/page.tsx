import LoginForm from '@/components/site/login-form';
import { googleConfigured } from '@/lib/google';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ role?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="hero-glow flex min-h-screen items-center justify-center px-6 py-32">
      <LoginForm
        initialRole={sp.role ?? 'student'}
        error={sp.error}
        googleEnabled={googleConfigured()}
      />
    </div>
  );
}
