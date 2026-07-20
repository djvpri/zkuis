import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ZKuis — Bank Soal AI',
    short_name: 'ZKuis',
    description: 'Generate dan latihan soal dari topik apapun dengan Gemini AI',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0f1e',
    theme_color: '#7c3aed',
    orientation: 'portrait-primary',
    categories: ['education', 'utilities'],
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
