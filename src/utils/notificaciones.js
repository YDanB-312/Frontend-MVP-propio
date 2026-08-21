import { findProjectById } from '../data/mockData'

const TIPO_META = {
  similitud: { icono: 'chart-line', label: 'Similitud', iconoClase: 'peligro' },
  revision: { icono: 'clock', label: 'Revisión', iconoClase: 'advertencia' },
  mensaje: { icono: 'comment', label: 'Mensaje', iconoClase: 'informativa' },
  sistema: { icono: 'cog', label: 'Sistema', iconoClase: 'informativa' },
}

export function tituloNotificacion(tipo) {
  const map = {
    similitud: 'Similitud Detectada',
    revision: 'Revisión de Proyecto',
    mensaje: 'Mensaje del Sistema',
    sistema: 'Notificación del Sistema',
  }
  return map[tipo] || 'Notificación'
}

export function proyectoDeNotificacion(n) {
  if (n.projectId) return findProjectById(n.projectId)?.title || ''
  if (n.reporteId) return 'Reporte de falla'
  return 'Sistema'
}

export function buildNotificaciones(notifs, resolver) {
  return notifs.map((n) => {
    const meta = TIPO_META[n.tipo] || TIPO_META.sistema
    const resuelto = resolver(n)
    return {
      id: n.id,
      icono: meta.icono,
      iconoClase: meta.iconoClase,
      titulo: tituloNotificacion(n.tipo),
      descripcion: n.mensaje,
      tiempo: n.createdAt,
      proyecto: proyectoDeNotificacion(n),
      tipo: n.tipo,
      tipoLabel: meta.label,
      leida: n.leido,
      enlace: resuelto.enlace,
      textoEnlace: resuelto.textoEnlace,
      iconoEnlace: resuelto.iconoEnlace,
      state: resuelto.state || {},
    }
  })
}

export function opcionesProyecto(notificaciones) {
  const titulos = notificaciones.map((n) => n.proyecto).filter(Boolean)
  return [...new Set(titulos)]
}
