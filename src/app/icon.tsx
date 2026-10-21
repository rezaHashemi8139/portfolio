import { ImageResponse } from 'next/og';
import { getContent } from '@/lib/content';
import { initials } from '@/lib/site';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default async function Icon() {
  const c = await getContent();
  const mark = initials(c);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0d1a',
          color: '#00c9a7',
          fontSize: 28,
          fontWeight: 700,
          borderRadius: 16,
        }}
      >
        {mark}
      </div>
    ),
    size,
  );
}
