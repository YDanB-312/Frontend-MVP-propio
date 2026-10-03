import { test, expect } from '@playwright/test'
import { Buffer } from 'node:buffer'

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
  await page.waitForURL(`**${home}`, { timeout: 15000 })
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

// Adjunta el PDF obligatorio del registro (el input es invisible por diseño).
export async function adjuntarPdfSoporte(page, nombre = 'soporte.pdf') {
  await page.locator('input[aria-label="Documento de soporte"]').setInputFiles({
    name: nombre,
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'),
  })
}

// Crea una cuenta vía API como administrador (nace verificada, sin documento).
// Devuelve el correo para encadenar el flujo que la use.
export async function crearUsuarioApi(request, {
  nombre = 'E2E',
  apellido = 'Prueba',
  correo,
  password = 'clave123',
  rol = 'aprendiz',
}) {
  const acceso = await request.post('/v1/auth/login', {
    data: { correo: CUENTAS.admin.email, password: CUENTAS.admin.password },
  })
  expect(acceso.ok()).toBeTruthy()
  const { token } = await acceso.json()

  const alta = await request.post('/v1/general-users', {
    headers: { Authorization: `Bearer ${token}` },
    data: { nombre, apellido, correo, password, rol },
  })
  expect(alta.ok()).toBeTruthy()
  return correo
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

export { CUENTAS, expect, test }
