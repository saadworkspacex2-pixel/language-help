import { ImageResponse } from 'next/og';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

export default async function Icon() {
  let logo = '';
  let letter = 'L';
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, 'brand_logo')).limit(1);
    logo = rows[0]?.value ?? '';
    const nameRow = await db.select().from(settings).where(eq(settings.key, 'brand_name')).limit(1);
    letter = (nameRow[0]?.value || 'Language Help').slice(0, 1).toUpperCase();
  } catch {
    // database unavailable at build time — fall back to the letter mark
  }

  if (logo && /^https?:\/\//.test(logo)) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', background: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" width={64} height={64} style={{ objectFit: 'contain' }} />
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex', width: '100%', height: '100%',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #E51A24 0%, #b3131b 100%)',
          color: '#fff', fontSize: 40, fontWeight: 800,
          borderRadius: 14, letterSpacing: '-0.04em',
        }}
      >
        {letter}
      </div>
    ),
    size,
  );
}
