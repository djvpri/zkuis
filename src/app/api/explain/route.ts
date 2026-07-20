import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { pertanyaan, jawaban_benar, jawaban_user, pembahasan } = await req.json()

    const prompt = `Kamu adalah guru yang sabar dan suportif. Seorang siswa menjawab soal dengan salah.

Soal: ${pertanyaan}
Jawaban benar: ${jawaban_benar}
Jawaban siswa: ${jawaban_user}
Pembahasan singkat: ${pembahasan}

Berikan penjelasan yang:
1. Dimulai dengan mengakui usaha siswa secara singkat
2. Jelaskan MENGAPA jawaban siswa kurang tepat (1-2 kalimat)
3. Jelaskan MENGAPA jawaban yang benar adalah benar (dengan analogi atau contoh jika perlu)
4. Berikan tips atau cara mudah untuk mengingat konsep ini

Gunakan bahasa Indonesia yang ramah, mudah dimengerti, dan tidak lebih dari 150 kata.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    return NextResponse.json({ penjelasan: result.response.text().trim() })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
