export function iniciales(nombre) {
  return (nombre || '').split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

// Normaliza para búsquedas: minúsculas + sin tildes (María === maria)
export function norm(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function formatearFecha(fecha) {
  if (!fecha) return ''
  const [d, m, a] = String(fecha).split('/')
  if (!d || !m || !a) return fecha
  return `${Number(d)} ${MESES_CORTOS[Number(m) - 1]} ${a}`
}

export function parseFecha(fecha) {
  const [d, m, a] = String(fecha || '').split('/').map(Number)
  if (!d || !m || !a) return null
  return new Date(a, m - 1, d)
}

// Agrupa observaciones planas en hilos: [{ ...obsRaiz, respuestas: [...] }]
export function agruparObservaciones(lista) {
  const nodos = new Map(lista.map((o) => [o.id, { ...o, respuestas: [] }]))
  const raices = []
  lista.forEach((o) => {
    const nodo = nodos.get(o.id)
    const padre = o.respuestaA ? nodos.get(Number(o.respuestaA)) : undefined
    if (padre) padre.respuestas.push(nodo)
    else raices.push(nodo)
  })
  raices.forEach((r) => r.respuestas?.sort((a, b) => a.id - b.id))
  return raices
}


