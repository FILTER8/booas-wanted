import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const size = {
  width: 1200,
  height: 1200,
};

export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const imageUrl = `https://pub-eb33e85c31f24772bc25a0efea472efb.r2.dev/${id}.webp`;

  const imageRes = await fetch(imageUrl, {
    cache: 'force-cache',
  });

  if (!imageRes.ok) {
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

  const imageBuffer = await imageRes.arrayBuffer();

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
          src={imageBuffer as unknown as string}
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
}