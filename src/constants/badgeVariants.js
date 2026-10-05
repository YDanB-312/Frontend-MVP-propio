// Variantes de Badge por dominio. Fuente única para no divergir.

export const PROJECT_ESTADO_VARIANT = {
  borrador: 'neutral',
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
}

export const FICHA_ESTADO_VARIANT = {
  activo: 'success',
  finalizado: 'info',
  anulada: 'danger',
}

// Etiquetas legibles (fuente única para las vistas; antes había 13 copias).
export const PROJECT_ESTADO_LABEL = {
  borrador: 'Borrador',
  pendiente: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}

export const FICHA_ESTADO_LABEL = {
  activo: 'Activo',
  finalizado: 'Finalizado',
  anulada: 'Anulada',
}

// Etiquetas legibles de rol (misma fuente única que las de estado).
export const ROL_LABEL = {
  aprendiz: 'Aprendiz',
  instructor: 'Instructor',
  admin: 'Administrador',
}
