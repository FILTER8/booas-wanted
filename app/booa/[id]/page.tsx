import { Metadata } from 'next'

const BASE_IMAGE_URL = 'https://pub-eb33e85c31f24772bc25a0efea472efb.r2.dev'

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id
  const imageUrl = `${BASE_IMAGE_URL}/${id}.webp`

  return {
    title: `BOOA #${id}`,
    description: `Khôra BOOA agent #${id}`,
    openGraph: {
      title: `BOOA #${id}`,
      description: `Khôra BOOA agent`,
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: `BOOA #${id}`,
      description: `Khôra BOOA agent`,
      images: [imageUrl],
    },
  }
}

export default function Page({ params }: Props) {
  const imageUrl = `${BASE_IMAGE_URL}/${params.id}.webp`

  return (
    <main style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <img
        src={imageUrl}
        alt={`BOOA ${params.id}`}
        style={{ imageRendering: 'pixelated', width: 512 }}
      />
    </main>
  )
}