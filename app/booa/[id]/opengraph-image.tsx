import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const size = {
  width: 1200,
  height: 1200,
};

export const contentType = 'image/png';
export const alt = 'BOOA preview card';

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType: string) {
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;

    const imageUrl = `https://pub-eb33e85c31f24772bc25a0efea472efb.r2.dev/${id}.webp`;

    const imageRes = await fetch(imageUrl, {
      cache: 'no-store',
    });

    if (!imageRes.ok) {
      throw new Error(`Failed to fetch BOOA image: ${imageRes.status}`);
    }

    const imageBuffer = await imageRes.arrayBuffer();
    const mimeType = imageRes.headers.get('content-type') || 'image/webp';
    const dataUrl = arrayBufferToDataUrl(imageBuffer, mimeType);

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <img
            src={dataUrl}
            width="840"
            height="840"
            style={{
              objectFit: 'contain',
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: 40,
              bottom: 40,
              display: 'flex',
              color: '#fff',
              fontSize: 54,
              fontWeight: 700,
            }}
          >
            BOOA #{id}
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown OG image error';

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 42,
            fontWeight: 700,
            padding: 40,
            textAlign: 'center',
          }}
        >
          <div>BOOA preview failed</div>
          <div style={{ fontSize: 24, marginTop: 20 }}>{message}</div>
        </div>
      ),
      {
        ...size,
      }
    );
  }
}