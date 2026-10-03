import { test, expect, CUENTAS } from './helpers'

// Cuenta creada por el admin (clave temporal): el primer ingreso obliga a
// cambiarla antes de usar la aplicación.
test.describe('Cambio de contraseña obligatorio', () => {
  test('una clave temporal redirige al cambio y luego deja entrar', async ({ page, request }) => {
    const correo = `temp.e2e.${Date.now()}@sena.edu.co`

    // El admin crea la cuenta con clave temporal vía API.
    const loginAdmin = await request.post('/v1/auth/login', {
      data: { correo: CUENTAS.admin.email, password: CUENTAS.admin.password },
    })
    const { token } = await loginAdmin.json()
    const alta = await request.post('/v1/general-users', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        nombre: 'Temporal E2E',
        apellido: 'Prueba',
        correo,
        password: 'temporal123',
        rol: 'instructor',
      },
    })
    expect(alta.ok()).toBeTruthy()

    // Primer ingreso: cae en la pantalla de cambio obligatorio.
    await page.goto('/login')
    await page.getByPlaceholder(/Correo electr/i).fill(correo)
    await page.locator('input[type="password"]').fill('temporal123')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await page.waitForURL('**/cambiar-contrasena', { timeout: 15000 })

    // Aunque intente ir al dashboard, sigue retenido.
    await page.goto('/instructor/dashboard')
    await page.waitForURL('**/cambiar-contrasena')

    const campos = page.locator('form input[type="password"]')
    await campos.nth(0).fill('temporal123')
    await campos.nth(1).fill('nuevaClave123')
    await campos.nth(2).fill('nuevaClave123')
    await page.getByRole('button', { name: /Actualizar contraseña/i }).click()
    await page.waitForURL('**/instructor/dashboard', { timeout: 15000 })
    await expect(page.getByText(/Hola,/i).first()).toBeVisible()
  })
})
