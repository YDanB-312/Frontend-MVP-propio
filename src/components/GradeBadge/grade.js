// Grado canirun a partir del puntaje. Acepta fracción 0-1 o porcentaje 0-100.
// Umbrales alineados con los niveles de la app: A(70)=alta, B(40)=media.
export function gradeForScore(score) {
  const n = Number(score)
  const pct = Number.isFinite(n) ? (n <= 1 ? Math.round(n * 100) : Math.round(n)) : 0
  if (pct >= 90) return { grade: 'S', pct }
  if (pct >= 70) return { grade: 'A', pct }
  if (pct >= 40) return { grade: 'B', pct }
  return { grade: 'C', pct }
}

export const NIVEL_GRADO = { S: 'excepcional', A: 'alta', B: 'media', C: 'baja' }
