import { test, expect } from '@playwright/test'

const CUENTAS = {
  aprendiz: { email: 'maria.gonzalez@soy.sena.edu.co', password: '123456', home: '/aprendiz/dashboard', nombre: 'María' },
  instructor: { email: 'carlos.ruiz@sena.edu.co', password: '123456', home: '/instructor/dashboard', nombre: 'Carlos' },
  admin: { email: 'admin@sena.edu.co', password: 'admin123', home: '/admin/dashboard', nombre: 'admin' },
  otro: { email: 'carlos.rodriguez@sena.edu.co', password: '123456', home: '/instructor/dashboard', nombre: 'Carlos R' },
}

// Login genérico con credenciales explícitas (sirve para cuentas creadas en
// tiempo de ejecución, p. ej. la simulación cruzada).
export async function entrar(page, email, password, home) {
  await page.goto('/login')
  await page.getByPlaceholder(/Correo electr/i).fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click()

  // Una cuenta con clave temporal pasa primero por el cambio obligatorio.
  await page.waitForURL(
    (url) => url.pathname === '/cambiar-contrasena' || url.pathname === home,
    { timeout: 15000 },
  )
  if (new URL(page.url()).pathname === '/cambiar-contrasena') {
    const formulario = page.locator('form')
    const campos = formulario.locator('input[type="password"]')
    // Se reutiliza la misma clave (debe cumplir el mínimo de 8) para no romper
    // logins posteriores del mismo spec.
    await campos.nth(0).fill(password)
    await campos.nth(1).fill(password)
    await campos.nth(2).fill(password)
    await formulario.getByRole('button', { name: /Actualizar contraseña/i }).click()
    await page.waitForURL(`**${home}`, { timeout: 15000 })
  }
}

export async function login(page, role) {
  const cta = CUENTAS[role]
  await entrar(page, cta.email, cta.password, cta.home)
  return cta
}

export async function logout(page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await page.waitForURL('**/login')
}

export async function esperarDashboard(page, role) {
  await page.waitForURL(`**/${role}/dashboard`)
}

// Confirma un borrado en el modal reforzado: marca la responsabilidad y, si el
// modal exige verificación, escribe el texto (por defecto "ELIMINAR").
export async function confirmarBorrado(page, verificacion = null) {
  const dialog = page.getByRole('alertdialog')
  await dialog.getByRole('checkbox').check()
  if (verificacion) await dialog.getByRole('textbox').fill(verificacion)
  await dialog.getByRole('button', { name: /Sí, eliminar/i }).click()
}

// ---------------------------------------------------------------- Identidad
// Crea la identidad en el padrón (API con token admin) para poder registrar
// cuentas nuevas desde la UI en los specs.
export async function crearIdentidad(request, { rol = 'aprendiz', nombre = 'Test', apellido = 'E2E' } = {}) {
  const sufijo = `${Date.now()}${Math.floor(Math.random() * 1000)}`
  const dominio = rol === 'aprendiz' ? 'soy.sena.edu.co' : 'sena.edu.co'
  const correo = `${rol}.e2e.${sufijo}@${dominio}`
  const numero_documento = sufijo.slice(-10)

  const loginAdmin = await request.post('/v1/auth/login', {
    data: { correo: CUENTAS.admin.email, password: CUENTAS.admin.password },
  })
  if (!loginAdmin.ok()) throw new Error(`Login admin para padrón falló (${loginAdmin.status()})`)
  const { token } = await loginAdmin.json()

  const res = await request.post('/v1/padron', {
    headers: { Authorization: `Bearer ${token}` },
    data: { tipo_documento: 'CC', numero_documento, nombre, apellido, correo, rol },
  })
  if (!res.ok()) throw new Error(`No se pudo crear la identidad en el padrón (${res.status()})`)

  return { correo, numero_documento, password: 'clave12345' }
}

// Flujo institucional completo desde la UI: validar padrón → crear cuenta →
// activar con el código que muestra la confirmación (modo local).
export async function registrarYActivar(page, request, opciones = {}) {
  const identidad = await crearIdentidad(request, opciones)

  await page.goto('/register')
  await page.getByPlaceholder('Ej. 1012345678').fill(identidad.numero_documento)
  await page.getByPlaceholder(/soy\.sena\.edu\.co/).fill(identidad.correo)
  await page.getByRole('button', { name: /Validar mis datos/i }).click()

  const campos = page.locator('input[autocomplete="new-password"]')
  await expect(campos.first()).toBeVisible()
  await campos.nth(0).fill(identidad.password)
  await campos.nth(1).fill(identidad.password)
  await page.getByRole('button', { name: /Crear cuenta/i }).click()
  await page.waitForURL('**/confirmacion')

  await page.getByRole('link', { name: /Activar mi cuenta/i }).click()
  await page.waitForURL('**/activar-cuenta')
  await page.getByRole('button', { name: /Activar cuenta/i }).click()
  await expect(page.getByRole('heading', { name: /Cuenta activada/i })).toBeVisible()

  return identidad
}

export { CUENTAS, expect, test }
