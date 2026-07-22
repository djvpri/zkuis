'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',         icon: 'bi-house',              iconActive: 'bi-house-fill',              label: 'Home'      },
  { href: '/generate', icon: 'bi-lightning-charge',   iconActive: 'bi-lightning-charge-fill',   label: 'Generate'  },
  { href: '/bank',     icon: 'bi-journal-text',       iconActive: 'bi-journal-text',            label: 'Bank Soal' },
  { href: '/saved',    icon: 'bi-bookmark',            iconActive: 'bi-bookmark-fill',           label: 'Tersimpan' },
]

const HIDE_ON = ['/quiz/', '/hasil/']

export default function BottomNav() {
  const pathname = usePathname()
  if (HIDE_ON.some(p => pathname.startsWith(p))) return null

  return (
    <>
      <div className="h-16 sm:hidden" />
      <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden bg-[#0a0f1e]/95 backdrop-blur-xl border-t border-white/5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {NAV.map(item => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors active:opacity-70 ${
                  active ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
                }`}>
                <i className={`bi ${active ? item.iconActive : item.icon} text-[22px] leading-none`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
