// Export soal ke PDF tanpa dependency — render HTML rapi ke <iframe>
// tersembunyi lalu panggil print (browser → "Simpan sebagai PDF").
// Dua versi: lembar Soal (kosong, untuk ujian) & Kunci + Pembahasan.

export interface PdfSoal {
  pertanyaan: string
  tipe: string
  opsi: Record<string, string> | null
  jawaban: string
  pembahasan: string
}

export interface PdfMeta {
  topik: string
  kategori?: string
  level?: string
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nl(s: string): string {
  return esc(s).replace(/\n/g, '<br>')
}

/**
 * @param withKey  true → sertakan jawaban benar + pembahasan (Kunci).
 *                 false → lembar soal kosong untuk dikerjakan.
 */
export function exportSoalPDF(soal: PdfSoal[], meta: PdfMeta, withKey: boolean) {
  const rows = soal.map((s, i) => {
    const isPG = s.tipe === 'pilihan_ganda' && s.opsi
    const opsi = isPG
      ? `<div class="opsi">${Object.entries(s.opsi as Record<string, string>)
          .map(([k, v]) => {
            const benar = withKey && k === s.jawaban
            return `<div class="opt${benar ? ' benar' : ''}"><span class="hk">${esc(k)}.</span> ${esc(v)}${benar ? ' <span class="cek">✓</span>' : ''}</div>`
          }).join('')}</div>`
      : ''
    const essay = !isPG && !withKey
      ? `<div class="garis"></div><div class="garis"></div><div class="garis"></div>`
      : ''
    const kunci = withKey
      ? isPG
        ? `<div class="jwb"><b>Jawaban:</b> ${esc(s.jawaban)}</div>`
        : `<div class="jwb"><b>Kunci Jawaban:</b> ${nl(s.jawaban)}</div>`
      : ''
    const pemb = withKey && s.pembahasan
      ? `<div class="pemb"><b>Pembahasan:</b> ${nl(s.pembahasan)}</div>`
      : ''
    return `<div class="soal">
      <div class="q"><span class="no">${i + 1}.</span> ${nl(s.pertanyaan)}</div>
      ${opsi}${essay}${kunci}${pemb}
    </div>`
  }).join('')

  const metaline = [meta.kategori, meta.level ? `Tingkat: ${meta.level}` : '', `${soal.length} soal`]
    .filter(Boolean).map(esc).join('  &middot;  ')

  const header = withKey
    ? `<div class="badge">KUNCI JAWABAN &amp; PEMBAHASAN</div>`
    : `<div class="idl">
        <span>Nama: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></span>
        <span>Kelas: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></span>
        <span>Nilai: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></span>
      </div>`

  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>${esc(meta.topik)}${withKey ? ' — Kunci' : ''}</title>
<style>
  @page { size: A4; margin: 18mm 16mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Georgia, serif; color:#111; font-size:12pt; line-height:1.55; margin:0; }
  h1 { font-size:16pt; margin:0 0 3px; text-align:center; }
  .metaline { text-align:center; font-size:10.5pt; color:#333; padding-bottom:9px; border-bottom:2px solid #111; margin-bottom:14px; }
  .badge { text-align:center; font-weight:700; letter-spacing:.5px; color:#b00020; margin-bottom:14px; }
  .idl { display:flex; justify-content:space-between; gap:12px; font-size:11pt; margin-bottom:16px; }
  .soal { margin-bottom:13px; page-break-inside: avoid; }
  .q { font-weight:600; }
  .no { font-weight:700; margin-right:2px; }
  .opsi { margin:3px 0 0 20px; }
  .opt { margin:1px 0; }
  .opt.benar { color:#0a7a28; font-weight:600; }
  .hk { display:inline-block; min-width:16px; font-weight:600; }
  .cek { font-weight:700; }
  .garis { border-bottom:1px solid #999; height:0; margin:12px 20px 0 0; }
  .jwb { margin:5px 0 0 20px; color:#0a7a28; }
  .pemb { margin:3px 0 0 20px; color:#444; font-size:11pt; text-align:justify; }
  .foot { margin-top:20px; padding-top:8px; border-top:1px solid #ccc; text-align:center; font-size:9pt; color:#999; }
</style></head><body>
  <h1>${esc(meta.topik)}</h1>
  <div class="metaline">${metaline || '&nbsp;'}</div>
  ${header}
  ${rows}
  <div class="foot">Dibuat dengan ZKuis &middot; Zomet</div>
</body></html>`

  printViaIframe(html)
}

function printViaIframe(html: string) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) { iframe.remove(); return }
  doc.open(); doc.write(html); doc.close()

  const done = () => setTimeout(() => iframe.remove(), 1000)
  const go = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch { /* ignore */ }
    done()
  }
  // Beri waktu render (font/layout) sebelum print.
  if (iframe.contentWindow) {
    iframe.contentWindow.onafterprint = () => setTimeout(() => iframe.remove(), 300)
    setTimeout(go, 350)
  } else {
    done()
  }
}
