import type { Metadata } from 'next'
import './globals.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

export const metadata: Metadata = {
  title: 'ZKuis — Bank Soal AI',
  description: 'Generate soal dari topik apapun atau dari materi kamu sendiri. Didukung Gemini AI.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-[#0a0f1e] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
