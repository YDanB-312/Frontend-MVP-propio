import { test, expect, adjuntarPdfSoporte } from './helpers'

test.describe('Registro de cuenta', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('valida nombres, correo, clave, confirmación y documento', async ({ page }) => {
    await page.getByRole('button', { name: /Crear Cuenta/i }).click()
    await expect(page.getByText(/Ingresa tus nombres/i)).toBeVisible()
    await expect(page.getByText(/Ingresa tus apellidos/i)).toBeVisible()
    await expect(page.getByText(/Adjunta el PDF/i)).toBeVisible()

    await page.getByPlaceholder('María José').fill('Test')
    await page.getByPlaceholder('González Ruiz').fill('E2E')
    await page.getByPlaceholder(/Correo electr/i).fill('no-es-correo')
    await page.locator('input[type="password"]').first().fill('123')
    await page.locator('input[type="password"]').nth(1).fill('123')
    await page.getByRole('button', { name: /Crear Cuenta/i }).click()
    await expect(page.getByText(/correo electrónico válido/i)).toBeVisible()
    await expect(page.getByText(/al menos 6 caracteres/i)).toBeVisible()

    await page.locator('input[type="password"]').first().fill('clave123')
    await page.locator('input[type="password"]').nth(1).fill('otra123')
    await page.getByRole('button', { name: /Crear Cuenta/i }).click()
    await expect(page.getByText(/no coinciden/i)).toBeVisible()
  })

  test('correo duplicado no avanza a confirmación', async ({ page }) => {
    await page.getByPlaceholder('María José').fill('Test')
    await page.getByPlaceholder('González Ruiz').fill('E2E')
    await page.getByPlaceholder(/Correo electr/i).fill('maria.gonzalez@soy.sena.edu.co')
    await page.locator('input[type="password"]').first().fill('clave123')
    await page.locator('input[type="password"]').nth(1).fill('clave123')
    await adjuntarPdfSoporte(page)
    await page.getByRole('button', { name: /Crear Cuenta/i }).click()
    await expect(page).not.toHaveURL(/\/confirmacion/)
    await expect(page.getByText(/ya está registrado|registrado/i).first()).toBeVisible()
  })

  test('registro con PDF queda en revisión y sin acceso al login', async ({ page }) => {
    const correo = `registro.e2e.${Date.now()}@correo.com`

    await page.getByPlaceholder('María José').fill('Registro E2E')
    await page.getByPlaceholder('González Ruiz').fill('Pendiente')
    await page.getByPlaceholder(/Correo electr/i).fill(correo)
    await page.locator('input[type="password"]').first().fill('clave123')
    await page.locator('input[type="password"]').nth(1).fill('clave123')
    await adjuntarPdfSoporte(page)
    await page.getByRole('button', { name: /Crear Cuenta/i }).click()

    // La confirmación avisa que la cuenta queda en revisión.
    await page.waitForURL('**/confirmacion')
    await expect(page.getByText(/quedó en revisión/i)).toBeVisible()

    // Sin aprobación no hay acceso.
    await page.goto('/login')
    await page.getByPlaceholder(/Correo electr/i).fill(correo)
    await page.locator('input[type="password"]').fill('clave123')
    await page.getByRole('button', { name: /Iniciar Sesi/i }).click()
    await expect(page.getByText(/pendiente de verificación/i).first()).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})
