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

function toDataUrl(buffer: ArrayBuffer, mimeType: string) {
  const base64 = Buffer.from(buffer).toString('base64')
  return `data:${mimeType};base64,${base64}`
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const imageUrl = `${BASE_IMAGE_URL}/${id}.webp`

  const res = await fetch(imageUrl, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch BOOA image: ${res.status}`)
  }

  const mimeType = res.headers.get('content-type') || 'image/webp'
  const buffer = await res.arrayBuffer()
  const src = toDataUrl(buffer, mimeType)

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
          src={src}
          alt={`BOOA #${id}`}
          width={540}
          height={540}
          style={{
            objectFit: 'contain',
            borderRadius: 16,
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