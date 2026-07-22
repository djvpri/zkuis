// Secret lintas-app ekosistem Zomet. Samakan CROSS_APP_SECRET dengan Z One.
export function getCrossAppSecret(): string {
  const s = process.env.CROSS_APP_SECRET
  if (!s) throw new Error('CROSS_APP_SECRET belum di-set (samakan dengan Z One).')
  return s
}
