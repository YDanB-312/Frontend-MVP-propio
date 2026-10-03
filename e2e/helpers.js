import { test, expect } from '@playwright/test'

const CUENTAS = {
  aprendiz: { username: 'mgonzalez', password: '123456', home: '/aprendiz/dashboard', nombre: 'María' },
  instructor: { username: 'cruiz', password: '123456', home: '/instructor/dashboard', nombre: 'Carlos' },
  admin: { username: 'a', password: 'admin123', home: '/admin/dashboard', nombre: 'admin' },
  otro: { username: 'crodriguez', password: '123456', home: '/instructor/dashboard', nombre: 'Carlos R' },
}

// Login genérico con credenciales explícitas (sirve para cuentas creadas en
// tiempo de ejecución, p. ej. la simulación cruzada).
export async function entrar(page, username, password, home) {
  await page.goto('/login')
  await page.getByPlaceholder('Usuario').fill(username)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
  await page.waitForURL(`**${home}`, { timeout: 15000 })
}

export async function login(page, role) {
  const cta = CUENTAS[role]
  await entrar(page, cta.username, cta.password, cta.home)
  return cta
}

export async function logout(page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await page.waitForURL('**/login')
}

// Crea una cuenta desde el admin (username y contraseña temporal generados),
// hace el primer ingreso con la temporal y la cambia por una conocida para el
// resto del flujo. Devuelve { username, password, correo }.
export async function crearUsuarioApi(request, {
  nombre = 'E2E',
  apellido = 'Prueba',
  correo,
  password = 'clave123',
  rol = 'aprendiz',
} = {}) {
  const acceso = await request.post('/v1/auth/login', {
    data: { username: CUENTAS.admin.username, password: CUENTAS.admin.password },
  })
  expect(acceso.ok()).toBeTruthy()
  const { token } = await acceso.json()

  const alta = await request.post('/v1/general-users', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      nombre,
      apellido,
      tipo_documento: 'CC',
      numero_documento: `${Date.now()}${Math.floor(Math.random() * 10)}`,
      correo: correo || `e2e.${Date.now()}@correo.com`,
      rol,
    },
  })
  expect(alta.ok()).toBeTruthy()
  const body = await alta.json()
  const username = body.credenciales.username
  const temporal = body.credenciales.password_temporal

  // Primer ingreso: la temporal obliga al cambio.
  const primerLogin = await request.post('/v1/auth/login', {
    data: { username, password: temporal },
  })
  expect(primerLogin.ok()).toBeTruthy()
  const tokenTemporal = (await primerLogin.json()).token

  const cambio = await request.put('/v1/auth/password', {
    headers: { Authorization: `Bearer ${tokenTemporal}` },
    data: {
      password_actual: temporal,
      password,
      password_confirmation: password,
    },
  })
  expect(cambio.ok()).toBeTruthy()

  return { username, password, correo: body.usuario.correo }
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
