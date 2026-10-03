import { test, expect, login, logout, entrar } from './helpers'

// Credenciales generadas por el sistema: el admin crea la cuenta, ve el usuario
// y la contraseña temporal, puede exportarlas en PDF y el usuario está obligado
// a cambiarla en su primer ingreso.

test('el admin crea un usuario, exporta sus credenciales y el primer ingreso obliga al cambio', async ({ page }) => {
  const correo = `credenciales.${Date.now()}@correo.com`

  await login(page, 'admin')
  await page.goto('/admin/usuarios')
  await page.getByRole('button', { name: /Nuevo Usuario/i }).click()

  const form = page.locator('form')
  await form.getByPlaceholder('Ej. María José').fill('Credencial')
  await form.getByPlaceholder('Ej. González Ruiz').fill('E2E')
  await form.locator('select[name="tipoDocumento"]').selectOption('CC')
  await form.getByPlaceholder('Ej. 1234567890').fill(String(Date.now()).slice(-8))
  await form.getByPlaceholder('Correo personal').fill(correo)
  await form.locator('select[name="rol"]').selectOption('aprendiz')

  const [respuesta] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/v1/general-users') && r.request().method() === 'POST'),
    form.getByRole('button', { name: /Crear usuario/i }).click(),
  ])
  const body = await respuesta.json()
  const username = body.credenciales.username
  const temporal = body.credenciales.password_temporal
  expect(username.length).toBeGreaterThan(0)
  expect(temporal).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)

  // El panel muestra las credenciales y permite exportarlas.
  await expect(page.getByText(/creado\./i).first()).toBeVisible()
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /^PDF$/i }).click(),
  ])
  expect(descarga.suggestedFilename()).toMatch(/credenciales.*\.pdf/i)

  // Primer ingreso: la contraseña temporal obliga a cambiarla.
  await logout(page)
  await entrar(page, username, temporal, '/cambio-obligatorio')
  await page.getByLabel(/Contraseña temporal/i).fill(temporal)
  await page.getByLabel(/^Nueva contraseña/i).fill('nuevaClave123')
  await page.getByLabel(/Confirmar nueva contraseña/i).fill('nuevaClave123')
  await page.getByRole('button', { name: /Establecer contraseña/i }).click()
  await page.waitForURL('**/aprendiz/dashboard', { timeout: 15000 })
})

test('exportar credenciales de una ficha genera un PDF', async ({ page }) => {
  await login(page, 'admin')
  await page.goto('/admin/fichas')

  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('tbody tr').first().getByRole('button', { name: /Credenciales/i }).click(),
  ])
  expect(descarga.suggestedFilename()).toMatch(/credenciales-ficha-\d+\.pdf/i)
})

test('exportar credenciales de usuarios seleccionados genera un PDF', async ({ page }) => {
  await login(page, 'admin')
  await page.goto('/admin/usuarios')

  await page.locator('tbody tr').first().getByRole('checkbox').check()
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Exportar credenciales/i }).click(),
  ])
  expect(descarga.suggestedFilename()).toMatch(/credenciales-usuarios\.pdf/i)
})
