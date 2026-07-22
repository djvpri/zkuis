import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  // Wajib login SSO — lindungi kuota Gemini dari penyalahgunaan.
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi berakhir. Masuk lewat Z One.' }, { status: 401 })
  try {
    const { mode, topik, materi, kategori, jumlah, tipe, level, lampiran } = await req.json()

    // Lampiran multimodal (PDF/gambar) → inlineData untuk Gemini.
    const allowed = (m: string) => m === 'application/pdf' || (typeof m === 'string' && m.startsWith('image/'))
    const fileParts = (Array.isArray(lampiran) ? lampiran : [])
      .filter((f: { data?: unknown; mimeType?: string }) => f && typeof f.data === 'string' && allowed(f.mimeType || ''))
      .slice(0, 12)
      .map((f: { data: string; mimeType: string }) => ({ inlineData: { data: f.data, mimeType: f.mimeType } }))
    const totalB64 = fileParts.reduce((s, p) => s + p.inlineData.data.length, 0)
    if (totalB64 > 22 * 1024 * 1024) return NextResponse.json({ error: 'Lampiran terlalu besar (maks ~15MB)' }, { status: 413 })

    if (mode === 'topik' && (!topik || topik.length < 3))
      return NextResponse.json({ error: 'Topik terlalu pendek' }, { status: 400 })
    if (mode === 'materi' && fileParts.length === 0 && (!materi || materi.length < 50))
      return NextResponse.json({ error: 'Isi materi (min 50 karakter) atau upload PDF/gambar' }, { status: 400 })

    const tipeSoalLabel = tipe === 'pilihan_ganda' ? 'pilihan ganda (4 opsi A-D)'
      : tipe === 'essay' ? 'essay (jawaban terbuka)'
      : 'campuran (sebagian pilihan ganda, sebagian essay)'

    const sumberLabel = mode === 'topik'
      ? `topik: "${topik}" (kategori: ${kategori}, tingkat kesulitan: ${level})`
      : fileParts.length
        ? `dokumen/gambar yang DILAMPIRKAN${materi && materi.length ? `, dengan catatan tambahan:\n${materi}` : ''} (tingkat kesulitan: ${level}). Baca isi seluruh lampiran dengan teliti sebagai sumber utama soal`
        : `teks/materi berikut ini:\n\n${materi}\n\n(tingkat kesulitan: ${level})`

    const prompt = `Kamu adalah pembuat soal ujian profesional dalam Bahasa Indonesia.

Buat ${jumlah} soal ${tipeSoalLabel} berdasarkan ${sumberLabel}.

ATURAN PENTING:
- Soal harus bervariasi, tidak berulang, dan mencakup berbagai aspek dari ${mode === 'topik' ? 'topik tersebut' : 'materi yang diberikan'}
- Untuk pilihan ganda: buat 4 opsi (A, B, C, D) dengan hanya 1 jawaban benar
- Untuk essay: berikan jawaban model yang lengkap
- Setiap soal WAJIB dilengkapi penjelasan (pembahasan) mengapa jawaban tersebut benar
- Gunakan bahasa Indonesia yang baku dan jelas

Kembalikan HANYA JSON valid dengan format berikut (tanpa markdown, tanpa teks tambahan):
{
  "soal": [
    {
      "id": 1,
      "pertanyaan": "...",
      "tipe": "pilihan_ganda",
      "opsi": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "jawaban": "A",
      "pembahasan": "..."
    },
    {
      "id": 2,
      "pertanyaan": "...",
      "tipe": "essay",
      "opsi": null,
      "jawaban": "Jawaban model: ...",
      "pembahasan": "..."
    }
  ]
}`

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 65536, // cukup untuk sampai ~100 soal tanpa terpotong
        temperature: 1,
      },
    })
    const result = await model.generateContent(fileParts.length ? [{ text: prompt }, ...fileParts] : prompt)
    const text = result.response.text().trim()

    // Ekstrak JSON dari response (handle thinking tokens & code blocks)
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Tidak ada JSON dalam respons AI')
    const parsed = JSON.parse(match[0])

    if (!parsed.soal || !Array.isArray(parsed.soal) || parsed.soal.length === 0)
      throw new Error('Format respons AI tidak valid')

    return NextResponse.json({ soal: parsed.soal })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[generate error]', msg)
    if (msg.includes('JSON'))
      return NextResponse.json({ error: 'AI mengembalikan format yang tidak valid, coba lagi' }, { status: 500 })
    return NextResponse.json({ error: msg || 'Gagal generate soal' }, { status: 500 })
  }
}
