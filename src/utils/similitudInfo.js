// Utilidades compartidas de lectura de similitudes (solo lectura, sin estado).
// Centraliza el cálculo que antes vivía duplicado en varias páginas.

export function toPct(similitud) {
  const n = Number(similitud)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100)
}

// Máximo porcentaje y conteo de coincidencias de una propuesta.
// Retorna null si no tiene ninguna (las vistas muestran "—" o nada).
export function getSimilitudInfo(similitudes, projectId) {
  const propias = (similitudes || []).filter(
    (s) => s.projectId1 === projectId || s.projectId2 === projectId
  )
  if (propias.length === 0) return null
  return {
    pct: Math.max(...propias.map((s) => toPct(s.similitud))),
    count: propias.length,
  }
}

// Solo el máximo (para vistas que no muestran el conteo).
export function getSimilitudMax(similitudes, projectId) {
  return getSimilitudInfo(similitudes, projectId)?.pct ?? null
}
