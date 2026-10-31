import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { getContent } from '@/lib/content-server';
import ContentEditor from '@/components/admin/content-editor';
import { ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  await requireRole('management');
  const content = await getContent();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Homepage</p>
          <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
            Design & <span className="font-serif-accent font-normal italic text-[#6C757D]">copy.</span>
          </h1>
          <p className="mt-2 max-w-xl text-[13px] text-[#6C757D]">
            Edit the logo, hero, about story, and the Why Choose section. Changes go live instantly.
          </p>
        </div>
        <Link href="/" target="_blank" className="btn btn-outline btn-md gap-2">
          View website <ExternalLink size={14} />
        </Link>
      </div>
      <ContentEditor content={content} />
    </div>
  );
}
