import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const size = {
  width: 1200,
  height: 1200,
};

export const contentType = 'image/png';

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType: string) {
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const imageUrl = `https://pub-eb33e85c31f24772bc25a0efea472efb.r2.dev/${id}.webp`;

  try {
    const imageRes = await fetch(imageUrl, {
      cache: 'force-cache',
    });

    if (!imageRes.ok) {
      throw new Error(`Failed to fetch image: ${imageRes.status}`);
    }

    const imageBuffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get('content-type') || 'image/webp';
    const dataUrl = arrayBufferToDataUrl(imageBuffer, contentType);

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'black',
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
              color: 'white',
              fontSize: 54,
              fontWeight: 700,
            }}
          >
            BOOA #{id}
          </div>
        </div>
      ),
      { ...size }
    );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'black',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          BOOA #{id}
        </div>
      ),
      { ...size }
    );
  }
}