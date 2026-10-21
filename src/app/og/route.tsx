import { ImageResponse } from 'next/og';
import { getContent } from '@/lib/content';
import { plain } from '@/lib/markup';

export const dynamic = 'force-dynamic';

/** Fallback social card, generated from site.json, used when no OG image has been uploaded. */
export async function GET() {
  const c = await getContent();
  const name = `${c.profile.firstName} ${c.profile.lastName}`.trim();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: 'linear-gradient(135deg, #0d0d1a 0%, #1a1440 55%, #0b3b3a 100%)',
          color: '#f4f4f8',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 6, textTransform: 'uppercase', color: '#00c9a7' }}>
          {c.profile.core.join(' · ')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 104, fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
          <div style={{ display: 'flex', fontSize: 44, marginTop: 24, color: '#c9c9de' }}>{plain(c.profile.title)}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } },
  );
}
