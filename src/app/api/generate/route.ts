import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { mode, topik, materi, kategori, jumlah, tipe, level } = await req.json()

    if (mode === 'topik' && (!topik || topik.length < 3))
      return NextResponse.json({ error: 'Topik terlalu pendek' }, { status: 400 })
    if (mode === 'materi' && (!materi || materi.length < 50))
      return NextResponse.json({ error: 'Materi terlalu pendek (minimal 50 karakter)' }, { status: 400 })

    const tipeSoalLabel = tipe === 'pilihan_ganda' ? 'pilihan ganda (4 opsi A-D)'
      : tipe === 'essay' ? 'essay (jawaban terbuka)'
      : 'campuran (sebagian pilihan ganda, sebagian essay)'

    const sumberLabel = mode === 'topik'
      ? `topik: "${topik}" (kategori: ${kategori}, tingkat kesulitan: ${level})`
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Bersihkan markdown code block jika ada
    const json = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(json)

    if (!parsed.soal || !Array.isArray(parsed.soal))
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
