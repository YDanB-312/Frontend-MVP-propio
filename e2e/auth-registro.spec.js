import { test, expect, crearIdentidad } from './helpers'

// Registro institucional: solo pueden crear cuenta las personas que están en el
// padrón; después deben activar con el código de un solo uso.
test.describe('Registro institucional', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('valida documento y correo antes de consultar el padrón', async ({ page }) => {
    await page.getByRole('button', { name: /Validar mis datos/i }).click()
    await expect(page.getByText(/Ingresa tu número de documento/i)).toBeVisible()
    await expect(page.getByText(/correo electrónico válido/i)).toBeVisible()
  })

  test('rechaza datos que no están en el padrón', async ({ page }) => {
    await page.getByPlaceholder('Ej. 1012345678').fill('9999999999')
    await page.getByPlaceholder(/soy\.sena\.edu\.co/).fill('nadie.e2e@soy.sena.edu.co')
    await page.getByRole('button', { name: /Validar mis datos/i }).click()
    await expect(page.getByText(/no coinciden con la matrícula/i)).toBeVisible()
  })

  test('flujo completo: validar, crear y activar la cuenta', async ({ page, request }) => {
    const identidad = await crearIdentidad(request)

    await page.getByPlaceholder('Ej. 1012345678').fill(identidad.numero_documento)
    await page.getByPlaceholder(/soy\.sena\.edu\.co/).fill(identidad.correo)
    await page.getByRole('button', { name: /Validar mis datos/i }).click()

    // Identidad verificada: el rol lo definió el padrón, no el formulario.
    await expect(page.getByText(/Aprendiz ·/)).toBeVisible()

    const campos = page.locator('input[autocomplete="new-password"]')
    await campos.nth(0).fill(identidad.password)
    await campos.nth(1).fill(identidad.password)
    await page.getByRole('button', { name: /Crear cuenta/i }).click()
    await page.waitForURL('**/confirmacion')
    await expect(page.getByText(/Guarda tu código de activación/i)).toBeVisible()

    await page.getByRole('link', { name: /Activar mi cuenta/i }).click()
    await page.waitForURL('**/activar-cuenta')
    await page.getByRole('button', { name: /Activar cuenta/i }).click()
    await expect(page.getByRole('heading', { name: /Cuenta activada/i })).toBeVisible()
  })
})
