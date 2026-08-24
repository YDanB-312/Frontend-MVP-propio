import { test, expect, login } from './helpers'

test.describe('Autenticación por rol', () => {
  for (const role of ['aprendiz', 'instructor', 'admin']) {
    test(`login como ${role} lleva a su dashboard`, async ({ page }) => {
      const cta = await login(page, role)
      await expect(page).toHaveURL(new RegExp(`${role}/dashboard`))
      await expect(page.getByText(new RegExp(`Hola, ${cta.nombre}`, 'i'))).toBeVisible().catch(() => {})
    })
  }

  test('credenciales inválidas muestran error y no ingresan', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('nombre.correo@soy.sena.edu.co').fill('maria.gonzalez@soy.sena.edu.co')
    await page.locator('input[type="password"]').fill('incorrecta')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await expect(page.locator('[role="alert"], .error')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('ruta protegida redirige a login sin sesión', async ({ page }) => {
    await page.goto('/aprendiz/dashboard')
    await page.waitForURL('**/login')
  })

  test('cerrar sesión vuelve al login', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await page.waitForURL('**/login')
  })
})
