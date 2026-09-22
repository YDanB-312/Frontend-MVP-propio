// Rutas por rol. Fuente única para el destino post-login.

export const RUTA_POR_ROL = {
  aprendiz: '/aprendiz/dashboard',
  instructor: '/instructor/dashboard',
  admin: '/admin/dashboard',
  // El superadmin comparte el área /admin (es superset) con vista global.
  superadmin: '/admin/dashboard',
}
