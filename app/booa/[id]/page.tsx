import type { Metadata } from 'next'

const BASE_IMAGE_URL =
  'https://pub-eb33e85c31f24772bc25a0efea472efb.r2.dev'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const imageUrl = `${BASE_IMAGE_URL}/${id}.webp`

  return {
    title: `BOOA #${id}`,
    description: `Khôra BOOA #${id}`,
    openGraph: {
  title: `BOOA #${id}`,
  description: `Khôra BOOA #${id}`,
},
twitter: {
  card: 'summary_large_image',
  title: `BOOA #${id}`,
  description: `Khôra BOOA #${id}`,
},
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params
  const imageUrl = `${BASE_IMAGE_URL}/${id}.webp`

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 32,
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>BOOA #{id}</h1>
      <img
        src={imageUrl}
        alt={`BOOA ${id}`}
        style={{
          width: 512,
          height: 512,
          imageRendering: 'pixelated',
          borderRadius: 12,
        }}
      />
      <p>{imageUrl}</p>
    </main>
  )
}