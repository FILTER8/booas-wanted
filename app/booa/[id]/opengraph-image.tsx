import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 1200,
};

export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  const imageUrl = `https://pub-eb33e85c31f24772bc25a0efea472efb.r2.dev/${id}.webp`;

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
        {/* BOOA Image */}
        <img
          src={imageUrl}
          style={{
            width: '70%',
            height: '70%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
        />

        {/* Label */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            color: 'white',
            fontSize: 48,
            fontWeight: 700,
            fontFamily: 'monospace',
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
}