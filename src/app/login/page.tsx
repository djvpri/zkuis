const ZONE_URL = process.env.NEXT_PUBLIC_ZONE_URL || 'https://zone.zomet.my.id'

const ERRORS: Record<string, string> = {
  no_token: 'Token SSO tidak ditemukan. Coba masuk lagi.',
  invalid_token: 'Sesi SSO tidak valid atau kedaluwarsa. Coba masuk lagi.',
}

export default function LoginPage({ searchParams }: { searchParams: { err?: string } }) {
  const err = searchParams?.err
  const pesan = err ? ERRORS[err] || 'Terjadi kesalahan saat masuk.' : null

  return (
    <div className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-3xl">
          <i className="bi bi-patch-question-fill" />
        </div>
        <h1 className="text-2xl font-bold">ZKuis</h1>
        <p className="mt-1 text-sm text-slate-400">Bank Soal AI · Ekosistem Zomet</p>

        {pesan && (
          <p className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">{pesan}</p>
        )}

        <a
          href={`${ZONE_URL}/api/sso/zkuis`}
          className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 px-5 py-3 font-semibold text-white hover:opacity-90 transition"
        >
          <i className="bi bi-box-arrow-in-right" />
          Masuk lewat Z One
        </a>
        <p className="mt-4 text-xs text-slate-600">Gunakan akun ekosistem Zomet Anda.</p>
      </div>
    </div>
  )
}
