import { requireRole } from '@/lib/session';
import { listEmailTemplates } from '@/lib/email-store';
import { mailConfigured } from '@/lib/mailer';
import EmailEditor from '@/components/admin/email-editor';

export const dynamic = 'force-dynamic';

export default async function AdminEmailsPage() {
  await requireRole('management');
  const templates = await listEmailTemplates();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Automated emails</p>
        <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
          Mail that writes <span className="font-serif-accent font-normal italic text-[#6C757D]">itself.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#6C757D]">
          Every automatic email your site sends. Style the wording with bold, italic and text sizes — or switch to
          the HTML tab and edit the markup directly. Use <span className="font-mono text-[12px]">{'{{variables}}'}</span>{' '}
          to drop in names, codes and course details.
        </p>
      </div>

      <EmailEditor templates={templates} mailReady={mailConfigured()} />
    </div>
  );
}
