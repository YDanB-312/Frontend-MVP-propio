// Validadores compartidos. Solo la mecánica (regex, longitudes):
// cada formulario conserva sus propios mensajes.

// Topes de <Input maxLength> por semántica (todos ≤ max:255 del backend;
// número de ficha: 8 dígitos). Fuente única para no divergir.
export const MAX_NOMBRE = 80
export const MAX_TITULO = 120
export const MAX_CIUDAD = 60
export const MAX_PROGRAMA = 60
export const MAX_NUMERO_FICHA = 8
export const MAX_DESCRIPCION_CORTA = 300
export const MAX_DESCRIPCION = 600

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_PASSWORD_LENGTH = 6

export function esEmailValido(email) {
  return EMAIL_REGEX.test(String(email || '').trim())
}

export function esPasswordValida(password) {
  return String(password || '').length >= MIN_PASSWORD_LENGTH
}
