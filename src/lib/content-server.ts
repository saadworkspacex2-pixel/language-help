import { db } from '@/db';
import { settings } from '@/db/schema';
import { CONTENT_DEFAULTS, type SiteContent } from '@/lib/content';

export async function getContent(): Promise<SiteContent> {
  const rows = await db.select().from(settings);
  const merged: SiteContent = { ...CONTENT_DEFAULTS };
  for (const row of rows) {
    if (row.value !== null && row.value !== '' && row.key in CONTENT_DEFAULTS) {
      merged[row.key] = row.value;
    }
  }
  return merged;
}
