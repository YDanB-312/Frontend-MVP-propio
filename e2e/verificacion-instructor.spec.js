import { test, expect, login, logout, entrar, adjuntarPdfSoporte } from './helpers'

// Verificación de cuentas: el autoregistro (con PDF) queda pendiente y SIN
// acceso; el admin aprueba desde el detalle del usuario y recién entonces el
// instructor puede ingresar y crear fichas.
test('registro de instructor → aprobación del admin → creación de ficha', async ({ page }) => {
  const correo = `verif.e2e.${Date.now()}@correo.com`
  const numero = String(Date.now()).slice(-6)

  // 1) Autorregistro público como instructor (PDF obligatorio).
  await page.goto('/register')
  await page.getByPlaceholder(/Mar.a Jos/i).fill('Verif E2E')
  await page.getByPlaceholder(/Gonz.lez Ruiz/i).fill('Pendiente')
  await page.getByPlaceholder(/Correo electr/i).fill(correo)
  await page.locator('input[type="password"]').first().fill('clave123')
  await page.locator('input[type="password"]').nth(1).fill('clave123')
  await page.getByRole('radio', { name: /Instructor/i }).click()
  await adjuntarPdfSoporte(page)
  await page.getByRole('button', { name: /Crear Cuenta/i }).click()
  await page.waitForURL('**/confirmacion')

  // 2) Sin aprobación no puede ingresar.
  await page.goto('/login')
  await page.getByPlaceholder(/Correo electr/i).fill(correo)
  await page.locator('input[type="password"]').fill('clave123')
  await page.getByRole('button', { name: /Iniciar Sesi/i }).click()
  await expect(page.getByText(/pendiente de verificación/i).first()).toBeVisible()

  // 3) El admin revisa el documento y aprueba la cuenta.
  await login(page, 'admin')
  await page.goto('/admin/usuarios')
  await page.getByPlaceholder('Nombre o correo…').fill(correo)
  await page.locator('tr', { hasText: correo }).getByRole('link', { name: /^Ver$/ }).click()
  await page.waitForURL('**/admin/detalle-usuario/**')
  await expect(page.getByRole('button', { name: /Ver documento/i })).toBeEnabled()
  await page.getByRole('button', { name: /Aprobar cuenta/i }).click()
  await expect(page.getByText(/Cuenta verificada/i)).toBeVisible()

  // 4) Ya verificado, ingresa y crea su ficha (código del servidor).
  await logout(page)
  await entrar(page, correo, 'clave123', '/instructor/dashboard')
  await page.goto('/instructor/fichas?crear=1')
  await page.locator('form select[name="red"]').selectOption('Informática, Diseño y Desarrollo de Software')
  await page.locator('form select[name="programaId"]').selectOption({ label: 'ADSO' })
  await page.getByPlaceholder('Ej. Análisis y Desarrollo 2718').fill(`Ficha Verif ${numero}`)
  await page.getByPlaceholder('Ej. 3142101').fill(numero)
  await page.locator('form').getByRole('button', { name: /^Crear ficha$/i }).click()
  await expect(page.getByText('Ficha creada correctamente.')).toBeVisible()
  await expect(page.locator('code').filter({ hasText: /^[a-z]{3}-[a-z]{4}$/ }).first()).toBeVisible()
})
