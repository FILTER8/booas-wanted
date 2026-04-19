import { ImageResponse } from 'next/og'

const BASE_IMAGE_URL =
  'https://pub-eb33e85c31f24772bc25a0efea472efb.r2.dev'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'
export const alt = 'BOOA preview card'

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType: string) {
  const base64 = Buffer.from(buffer).toString('base64')
  return `data:${mimeType};base64,${base64}`
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params
    const imageUrl = `${BASE_IMAGE_URL}/${id}.webp`

    const imageRes = await fetch(imageUrl, {
      cache: 'no-store',
    })

    if (!imageRes.ok) {
      throw new Error(`Failed to fetch BOOA image: ${imageRes.status}`)
    }

    const imageBuffer = await imageRes.arrayBuffer()
    const mimeType = imageRes.headers.get('content-type') || 'image/webp'
    const dataUrl = arrayBufferToDataUrl(imageBuffer, mimeType)

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            backgroundColor: '#000',
            color: '#fff',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '40px 48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '14px',
              maxWidth: '420px',
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              BOOA #{id}
            </div>

            <div
              style={{
                fontSize: 30,
                opacity: 0.82,
              }}
            >
              Khôra BOOA
            </div>
          </div>

          <div
            style={{
              width: 540,
              height: 540,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: 20,
              backgroundColor: '#000',
            }}
          >
            <img
              src={dataUrl}
              width="540"
              height="540"
              style={{
                objectFit: 'contain',
                imageRendering: 'pixelated',
              }}
            />
          </div>
        </div>
      ),
      size
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown OG image error'

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
            textAlign: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              fontSize: 54,
              fontWeight: 700,
            }}
          >
            BOOA preview failed
          </div>

          <div
            style={{
              fontSize: 24,
              marginTop: 18,
              opacity: 0.8,
            }}
          >
            {message}
          </div>
        </div>
      ),
      size
    )
  }
}