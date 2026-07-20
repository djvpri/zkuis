import type { Metadata, Viewport } from 'next'
import './globals.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import BottomNav from '@/components/BottomNav'
import RegisterSW from '@/components/RegisterSW'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  themeColor: '#7c3aed',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'ZKuis — Bank Soal AI',
  description: 'Generate dan latihan soal dari topik apapun dengan Gemini AI. Didukung Google Gemini.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ZKuis',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-[#0a0f1e] text-slate-100 antialiased">
        {children}
        <BottomNav />
        <RegisterSW />
      </body>
    </html>
  )
}
