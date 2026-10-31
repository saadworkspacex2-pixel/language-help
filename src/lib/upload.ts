import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

/**
 * Save a File from FormData. Files are stored in public/uploads when the
 * filesystem is writable; on read-only/ephemeral hosts (serverless) the
 * image is returned as a data URI so it can be persisted in the database.
 */
export async function saveUpload(file: File | null, prefix = 'img'): Promise<string | null> {
  if (!file || typeof file === 'string' || file.size === 0) return null;

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const name = `${prefix}-${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buffer);
    return `/uploads/${name}`;
  } catch {
    // Filesystem unavailable (e.g. serverless): store as a data URI instead.
    const type = file.type.startsWith('image/') ? file.type : 'image/jpeg';
    return `data:${type};base64,${buffer.toString('base64')}`;
  }
}
