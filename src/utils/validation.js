// Validadores compartidos. Solo la mecánica (regex, longitudes):
// cada formulario conserva sus propios mensajes.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_PASSWORD_LENGTH = 6

export function esEmailValido(email) {
  return EMAIL_REGEX.test(String(email || '').trim())
}

export function esPasswordValida(password) {
  return String(password || '').length >= MIN_PASSWORD_LENGTH
}
