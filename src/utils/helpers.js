export function iniciales(nombre) {
  return (nombre || '').split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase()
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

export const ROL_INFO = {
  aprendiz: { label: 'Aprendiz', badge: 'exito', icon: 'user-graduate' },
  instructor: { label: 'Instructor', badge: 'advertencia', icon: 'chalkboard-teacher' },
  admin: { label: 'Admin', badge: 'peligro', icon: 'user-shield' },
}

export const etiquetaReporte = {
  pendiente: 'Pendiente',
  en_revision: 'En Revision',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
}

export const badgeReporte = {
  pendiente: { clase: 'advertencia', icono: 'clock' },
  en_revision: { clase: 'primario', icono: 'cog' },
  resuelto: { clase: 'exito', icono: 'check' },
  rechazado: { clase: 'neutral', icono: 'lock' },
}
