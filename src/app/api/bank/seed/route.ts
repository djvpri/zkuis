import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const PAKET: { kategori: string; subKategori: string; judul: string; jumlah: number; prompt: string }[] = [
  // TWK
  {
    kategori: 'TWK', subKategori: 'Pancasila', judul: 'Pancasila & Ideologi Negara',
    jumlah: 20,
    prompt: 'Soal tentang Pancasila sebagai ideologi dan dasar negara Indonesia: sejarah perumusan, nilai-nilai sila, penerapan dalam kehidupan bernegara, perbedaan dengan ideologi lain (liberalisme, komunisme). Gaya soal SKD CPNS BKN.',
  },
  {
    kategori: 'TWK', subKategori: 'UUD 1945', judul: 'UUD 1945 & Konstitusi',
    jumlah: 20,
    prompt: 'Soal tentang UUD 1945: pasal-pasal penting (hak asasi, lembaga negara, kewenangan), amandemen UUD, sistem pemerintahan, MPR/DPR/DPD/MA/MK/KY. Gaya soal SKD CPNS BKN.',
  },
  {
    kategori: 'TWK', subKategori: 'NKRI', judul: 'NKRI, Wawasan Nusantara & Bela Negara',
    jumlah: 20,
    prompt: 'Soal tentang konsep NKRI, wawasan nusantara, bela negara, ancaman terhadap persatuan bangsa, otonomi daerah, wilayah NKRI. Gaya soal SKD CPNS BKN.',
  },
  {
    kategori: 'TWK', subKategori: 'Bhineka Tunggal Ika', judul: 'Bhineka Tunggal Ika & Nasionalisme',
    jumlah: 15,
    prompt: 'Soal tentang Bhineka Tunggal Ika, kerukunan umat beragama, nasionalisme, semangat kebangsaan, sejarah perjuangan kemerdekaan Indonesia. Gaya soal SKD CPNS BKN.',
  },
  // TIU
  {
    kategori: 'TIU', subKategori: 'Verbal', judul: 'Kemampuan Verbal: Sinonim & Antonim',
    jumlah: 20,
    prompt: 'Soal kemampuan verbal: sinonim (persamaan kata), antonim (lawan kata), menggunakan kosa kata bahasa Indonesia baku tingkat menengah-tinggi. Gaya soal TIU SKD CPNS BKN.',
  },
  {
    kategori: 'TIU', subKategori: 'Verbal', judul: 'Kemampuan Verbal: Analogi & Penalaran',
    jumlah: 20,
    prompt: 'Soal analogi kata (A:B = C:?), penalaran verbal, menarik kesimpulan dari pernyataan, silogisme sederhana. Gaya soal TIU SKD CPNS BKN.',
  },
  {
    kategori: 'TIU', subKategori: 'Numerik', judul: 'Kemampuan Numerik: Aritmatika & Deret',
    jumlah: 20,
    prompt: 'Soal numerik: operasi hitung (persen, rasio, rata-rata), deret angka (lanjutkan pola), soal cerita matematika sederhana. Gaya soal TIU SKD CPNS BKN. Sertakan angka konkret dalam soal.',
  },
  {
    kategori: 'TIU', subKategori: 'Numerik', judul: 'Kemampuan Numerik: Perbandingan & Peluang',
    jumlah: 15,
    prompt: 'Soal perbandingan, skala, peluang sederhana, kecepatan-jarak-waktu, soal campuran untuk TIU SKD CPNS BKN. Sertakan angka konkret dalam soal.',
  },
  // TKP
  {
    kategori: 'TKP', subKategori: 'Pelayanan Publik', judul: 'Orientasi Pelayanan Publik',
    jumlah: 20,
    prompt: 'Soal TKP SKD CPNS tentang orientasi pelayanan: skenario pegawai ASN menghadapi warga/pengguna layanan. Setiap opsi A-D punya nilai berbeda (4=terbaik, 1=terburuk). Jawaban di field "jawaban" adalah huruf opsi TERBAIK. Masukkan hint nilai di pembahasan.',
  },
  {
    kategori: 'TKP', subKategori: 'Integritas', judul: 'Integritas & Anti-Korupsi',
    jumlah: 20,
    prompt: 'Soal TKP SKD CPNS tentang integritas, kejujuran, anti-korupsi, transparansi ASN. Skenario dilema etika. Setiap opsi A-D punya nilai berbeda (4=terbaik, 1=terburuk). Jawaban adalah opsi TERBAIK.',
  },
  {
    kategori: 'TKP', subKategori: 'Kerjasama', judul: 'Kerjasama & Semangat Berprestasi',
    jumlah: 20,
    prompt: 'Soal TKP SKD CPNS tentang kerjasama tim, semangat berprestasi, inisiatif, kreativitas ASN. Skenario di lingkungan kerja kantor pemerintah. Jawaban adalah opsi TERBAIK dari 4 opsi.',
  },
  {
    kategori: 'TKP', subKategori: 'Sosial Budaya', judul: 'Sosial Budaya & Teknologi',
    jumlah: 15,
    prompt: 'Soal TKP SKD CPNS tentang kemampuan adaptasi sosial budaya, memanfaatkan teknologi dalam pekerjaan, mengelola perubahan di instansi pemerintah. Jawaban adalah opsi TERBAIK dari 4 opsi.',
  },
]

function buildPrompt(p: typeof PAKET[0]): string {
  return `Kamu adalah pembuat soal SKD CPNS profesional untuk Badan Kepegawaian Negara (BKN) Indonesia.

Buat tepat ${p.jumlah} soal pilihan ganda dengan ketentuan:
- Konteks: ${p.prompt}
- Setiap soal memiliki 4 opsi (A, B, C, D)
- Field "jawaban" berisi huruf opsi yang benar/terbaik
- Field "pembahasan" berisi penjelasan singkat mengapa jawaban tersebut benar

Kembalikan HANYA JSON valid berikut (tanpa teks lain):
{
  "soal": [
    {
      "id": 1,
      "pertanyaan": "...",
      "tipe": "pilihan_ganda",
      "opsi": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "jawaban": "A",
      "pembahasan": "..."
    }
  ]
}`
}

export async function POST(req: NextRequest) {
  // Hanya admin (email tertentu) yang bisa seed
  const session = await getSession()
  const adminEmail = process.env.ADMIN_EMAIL || 'sentarummedia@gmail.com'
  if (!session || session.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const target = body.paket as string | undefined // bisa filter 1 paket saja

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const hasil: { judul: string; ok: boolean; jumlah?: number; error?: string }[] = []

  const daftar = target ? PAKET.filter(p => p.judul === target) : PAKET

  for (const paket of daftar) {
    try {
      const result = await model.generateContent(buildPrompt(paket))
      const text = result.response.text()
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Gemini tidak return JSON')

      const parsed = JSON.parse(match[0]) as { soal: unknown[] }
      if (!Array.isArray(parsed.soal) || parsed.soal.length === 0) throw new Error('Soal kosong')

      // Hapus versi lama jika ada
      await prisma.bankSoal.deleteMany({
        where: { kategori: paket.kategori, subKategori: paket.subKategori, judul: paket.judul },
      })

      await prisma.bankSoal.create({
        data: {
          kategori: paket.kategori,
          subKategori: paket.subKategori,
          judul: paket.judul,
          soal: parsed.soal as unknown as Prisma.InputJsonValue,
          jumlah: parsed.soal.length,
          level: 'sedang',
        },
      })
      hasil.push({ judul: paket.judul, ok: true, jumlah: parsed.soal.length })
    } catch (e) {
      hasil.push({ judul: paket.judul, ok: false, error: String(e) })
    }
  }

  const ok = hasil.filter(h => h.ok).length
  const gagal = hasil.filter(h => !h.ok).length
  return NextResponse.json({ ok, gagal, detail: hasil })
}
