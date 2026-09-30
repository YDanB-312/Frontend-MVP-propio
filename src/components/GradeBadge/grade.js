// Grado de coincidencia, SIEMPRE relativo al umbral vigente del motor.
//   A (alta) : pct >= umbral
//   B (media): pct >= umbral / 2
//   C (baja) : el resto
// Acepta fracción 0-1 o porcentaje 0-100. El umbral llega en porcentaje (0-100).
export function gradeForScore(score, umbralPct = 30) {
  const n = Number(score)
  const pct = Number.isFinite(n) ? (n <= 1 ? Math.round(n * 100) : Math.round(n)) : 0
  const u = Number(umbralPct) > 0 ? Number(umbralPct) : 30
  if (pct >= u) return { grade: 'A', pct }
  if (pct >= u / 2) return { grade: 'B', pct }
  return { grade: 'C', pct }
}

export const NIVEL_GRADO = { A: 'alta', B: 'media', C: 'baja' }
