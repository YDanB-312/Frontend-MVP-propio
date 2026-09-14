import { test, expect } from './helpers'

test.describe('Recuperar contraseña', () => {
  test('correo inválido muestra error y válido muestra confirmación', async ({ page }) => {
    await page.goto('/recuperar-contrasena')
    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('no-es-correo')
    await page.getByRole('button', { name: /Enviar enlace/i }).click()
    await expect(page.getByText(/correo electrónico válido/i)).toBeVisible()

    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('maria.gonzalez@soy.sena.edu.co')
    await page.getByRole('button', { name: /Enviar enlace/i }).click()
    await expect(page.getByText('Revisa tu correo')).toBeVisible()

    await page.getByRole('button', { name: /Usar otro correo/i }).click()
    await expect(page.getByPlaceholder('tu.correo@ejemplo.com')).toBeVisible()
  })
})

test.describe('Restablecer contraseña', () => {
  test('valida correo, longitud, coincidencia y cuenta existente', async ({ page }) => {
    await page.goto('/restablecer-contrasena')
    const pass = page.locator('input[type="password"]')

    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('maria.gonzalez@soy.sena.edu.co')
    await pass.nth(0).fill('123')
    await pass.nth(1).fill('123')
    await page.getByRole('button', { name: /^Restablecer contraseña$/i }).click()
    await expect(page.getByText(/al menos 6 caracteres/i)).toBeVisible()

    await pass.nth(0).fill('clave123')
    await pass.nth(1).fill('otra123')
    await page.getByRole('button', { name: /^Restablecer contraseña$/i }).click()
    await expect(page.getByText(/no coinciden/i)).toBeVisible()

    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('nadie@ejemplo.com')
    await pass.nth(0).fill('clave123')
    await pass.nth(1).fill('clave123')
    await page.getByRole('button', { name: /^Restablecer contraseña$/i }).click()
    await expect(page.getByText(/No encontramos una cuenta/i)).toBeVisible()
  })

  test('restablece y permite iniciar sesión con la nueva clave', async ({ page }) => {
    await page.goto('/restablecer-contrasena')
    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('juan.perez@soy.sena.edu.co')
    const pass = page.locator('input[type="password"]')
    await pass.nth(0).fill('nueva123')
    await pass.nth(1).fill('nueva123')
    await page.getByRole('button', { name: /^Restablecer contraseña$/i }).click()
    await expect(page.getByText('Contraseña restablecida')).toBeVisible()

    await page.getByRole('link', { name: /Ir al login/i }).click()
    await page.waitForURL('**/login')
    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('juan.perez@soy.sena.edu.co')
    await page.locator('input[type="password"]').fill('nueva123')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await page.waitForURL('**/aprendiz/dashboard', { timeout: 15000 })
  })
})
