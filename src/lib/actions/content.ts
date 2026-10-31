'use server';

import { db } from '@/db';
import { settings } from '@/db/schema';
import { requireRole } from '@/lib/session';
import { saveUpload } from '@/lib/upload';
import { CONTENT_DEFAULTS } from '@/lib/content';
import { revalidatePath } from 'next/cache';

async function setSetting(key: string, value: string) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

/**
 * Generic content saver. Text fields are stored as-is; file inputs are uploaded
 * and their resulting URL stored. Empty file inputs keep the existing image.
 */
export async function saveContent(prev: unknown, formData: FormData) {
  await requireRole('management');
  try {
    // Image URL companions (field__url) are applied first; an uploaded file wins.
    for (const [key, value] of formData.entries()) {
      if (!key.endsWith('__url')) continue;
      const realKey = key.slice(0, -5);
      if (!(realKey in CONTENT_DEFAULTS)) continue;
      const url = String(value).trim();
      if (url) await setSetting(realKey, url);
    }

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('$') || key.endsWith('__url')) continue;
      if (!(key in CONTENT_DEFAULTS)) continue; // only known content keys

      if (typeof value === 'object' && value !== null && 'arrayBuffer' in value) {
        const file = value as File;
        if (file.size > 0) {
          const url = await saveUpload(file, 'site');
          if (url) await setSetting(key, url);
        }
      } else {
        await setSetting(key, String(value));
      }
    }
    revalidatePath('/', 'layout');
    return { ok: true, at: Date.now() };
  } catch {
    return { ok: false, error: 'Could not save content. Please try again.' };
  }
}

/** Reset a single content key back to its built-in default. */
export async function resetContentKey(formData: FormData) {
  await requireRole('management');
  const key = String(formData.get('key') || '');
  if (key in CONTENT_DEFAULTS) {
    await setSetting(key, CONTENT_DEFAULTS[key]);
    revalidatePath('/', 'layout');
  }
}
