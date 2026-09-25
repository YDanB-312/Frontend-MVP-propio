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

// Formatea una fecha que viene de la API.
// - Si es "YYYY-MM-DD" (date-only) se interpreta como día LOCAL por componentes,
//   evitando el desfase de zona (new Date("2026-09-16") = medianoche UTC).
// - Si trae hora (ISO), se usa Date y se muestra en la zona del usuario.
export function fechaDesdeApi(valor) {
  if (!valor) return ''
  const texto = String(valor)
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto)
  if (soloFecha) {
    const [, y, m, d] = soloFecha
    return formatearFecha(`${Number(d)}/${Number(m)}/${y}`)
  }
  const fecha = new Date(texto)
  if (Number.isNaN(fecha.getTime())) return texto
  return formatearFecha(`${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`)
}

// Fecha de HOY en zona local (YYYY-MM-DD). Evita el off-by-one que produce
// `toISOString()` en horas de la noche (UTC).
export function fechaHoyLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

// Código de ficha único con el formato del catálogo: abc-defg (3 + 4 letras).
export function generarCodigoFicha(existentes = []) {
  const letras = 'abcdefghijklmnopqrstuvwxyz'
  const bloque = (n) => Array.from({ length: n }, () => letras[Math.floor(Math.random() * letras.length)]).join('')
  let codigo
  let intento = 0
  do {
    codigo = `${bloque(3)}-${bloque(4)}`
    intento += 1
  } while (existentes.some((f) => f.codigo === codigo) && intento < 20)
  return codigo
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


