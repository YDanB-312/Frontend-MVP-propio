import { test, expect, login, logout, entrar, adjuntarPdfSoporte } from './helpers'

// Verificación de aprendices: el autoregistro (con PDF) queda pendiente y SIN
// acceso; tras la aprobación del admin puede ingresar y unirse a una ficha con
// el código del instructor.
test('registro de aprendiz → aprobación del admin → unión a ficha', async ({ page }) => {
  const correo = `aprendiz.verif.${Date.now()}@correo.com`

  // 1) Autorregistro público como aprendiz (PDF obligatorio).
  await page.goto('/register')
  await page.getByPlaceholder(/Mar.a Jos/i).fill('Aprendiz Verif')
  await page.getByPlaceholder(/Gonz.lez Ruiz/i).fill('Pendiente')
  await page.getByPlaceholder(/Correo electr/i).fill(correo)
  await page.locator('input[type="password"]').first().fill('clave123')
  await page.locator('input[type="password"]').nth(1).fill('clave123')
  await adjuntarPdfSoporte(page)
  await page.getByRole('button', { name: /Crear Cuenta/i }).click()
  await page.waitForURL('**/confirmacion')

  // 2) Sin aprobación no puede ingresar.
  await page.goto('/login')
  await page.getByPlaceholder(/Correo electr/i).fill(correo)
  await page.locator('input[type="password"]').fill('clave123')
  await page.getByRole('button', { name: /Iniciar Sesi/i }).click()
  await expect(page.getByText(/pendiente de verificación/i).first()).toBeVisible()

  // 3) El admin aprueba la cuenta.
  await login(page, 'admin')
  await page.goto('/admin/usuarios')
  await page.getByPlaceholder('Nombre o correo…').fill(correo)
  await page.locator('tr', { hasText: correo }).getByRole('link', { name: /^Ver$/ }).click()
  await page.waitForURL('**/admin/detalle-usuario/**')
  await page.getByRole('button', { name: /Aprobar cuenta/i }).click()
  await expect(page.getByText(/Cuenta verificada/i)).toBeVisible()

  // 4) Ya verificado, ingresa y se une a la ficha del seed con su código.
  await logout(page)
  await entrar(page, correo, 'clave123', '/aprendiz/dashboard')
  await page.getByLabel(/Navegaci.n principal/).getByRole('link', { name: 'Ficha' }).click()
  await expect(page).toHaveURL(/\/aprendiz\/ficha/)
  await page.getByLabel(/Código de la ficha/i).fill('bnt-jhsa')
  await page.getByRole('button', { name: /Buscar ficha/i }).click()
  await page.getByRole('button', { name: /Unirme a esta ficha/i }).click()
  await expect(page.getByRole('heading', { name: /Analisis y Desarrollo 2634/ })).toBeVisible({ timeout: 15000 })
})
