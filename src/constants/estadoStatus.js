export const PROPUESTA_STATUS = {
  borrador: 'pending',
  pendiente: 'pending',
  aprobado: 'done',
  rechazado: 'failed',
}

export const REPORTE_STATUS = {
  pendiente: 'pending',
  en_revision: 'running',
  resuelto: 'done',
  cerrado: 'cancelled',
  rechazado: 'failed',
}

// Reportes de falla: etiquetas y prioridad derivada del tipo (fuente única).
export const REPORTE_ESTADO_LABEL = {
  pendiente: 'Pendiente',
  en_revision: 'En Revisión',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
  rechazado: 'Rechazado',
}

export const REPORTE_TIPO_LABEL = {
  sistema: 'Sistema',
  proyecto: 'Proyecto',
  datos: 'Datos',
  bug_ui: 'Interfaz',
  error_datos: 'Error de datos',
  rendimiento: 'Rendimiento',
  seguridad: 'Seguridad',
  otro: 'Otro',
}

export const REPORTE_PRIORIDAD_META = {
  baja: { label: 'Baja', variant: 'neutral' },
  media: { label: 'Media', variant: 'warning' },
  alta: { label: 'Alta', variant: 'danger' },
  critica: { label: 'Crítica', variant: 'danger' },
}

export const REPORTE_PRIORIDAD_POR_TIPO = {
  sistema: { label: 'Alta', variant: 'danger' },
  proyecto: { label: 'Media', variant: 'warning' },
  datos: { label: 'Media', variant: 'warning' },
  bug_ui: { label: 'Media', variant: 'warning' },
  error_datos: { label: 'Alta', variant: 'danger' },
  rendimiento: { label: 'Alta', variant: 'danger' },
  seguridad: { label: 'Crítica', variant: 'danger' },
  otro: { label: 'Baja', variant: 'neutral' },
}

