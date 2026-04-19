import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'
export const alt = 'BOOA preview card'

const BASE_IMAGE_URL =
  'https://pub-eb33e85c31f24772bc25a0efea472efb.r2.dev'

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const imageUrl = `${BASE_IMAGE_URL}/${id}.webp`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          position: 'relative',
        }}
      >
        <img
          src={imageUrl}
          alt={`BOOA #${id}`}
          width={360}
          height={360}
          style={{
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 40,
            bottom: 32,
            color: '#fff',
            fontSize: 52,
            fontWeight: 700,
            display: 'flex',
          }}
        >
          BOOA #{id}
        </div>
      </div>
    ),
    size
  )
}