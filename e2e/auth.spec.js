import { test, expect, login, logout } from './helpers'

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
    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('maria.gonzalez@soy.sena.edu.co')
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

test.describe('Seguridad de la cuenta', () => {
  test('cambiar contraseña exige la actual y la nueva queda activa', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/perfil')

    // El rol permanece visible incluso durante la edición del perfil (campo de solo lectura)
    await page.getByRole('button', { name: /Editar perfil/i }).click()
    await expect(page.getByRole('main').getByText('Rol', { exact: true })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Rol' })).toHaveValue('Aprendiz')
    await expect(page.getByRole('textbox', { name: 'Nombre completo' })).toHaveValue('María González')
    await page.getByRole('main').getByRole('button', { name: 'Cancelar' }).click()

    // Abrir el formulario de seguridad
    await page.getByRole('button', { name: /Cambiar contraseña/i }).click()
    const formulario = page.locator('form', { hasText: 'Contraseña actual' })
    const campos = formulario.locator('input[type="password"]')

    // Contraseña actual incorrecta → rechaza
    await campos.nth(0).fill('clave-equivocada')
    await campos.nth(1).fill('nuevaClave123')
    await campos.nth(2).fill('nuevaClave123')
    await formulario.getByRole('button', { name: /Actualizar contraseña/i }).click()
    await expect(page.getByText(/La contraseña actual no es correcta/i)).toBeVisible()

    // Confirmación que no coincide → rechaza
    await campos.nth(0).fill('123456')
    await campos.nth(2).fill('otraClave999')
    await formulario.getByRole('button', { name: /Actualizar contraseña/i }).click()
    await expect(page.getByText(/Las contraseñas no coinciden/i)).toBeVisible()

    // Flujo exitoso
    await campos.nth(0).fill('123456')
    await campos.nth(1).fill('nuevaClave123')
    await campos.nth(2).fill('nuevaClave123')
    await formulario.getByRole('button', { name: /Actualizar contraseña/i }).click()
    await expect(page.getByText(/Contraseña actualizada correctamente/i)).toBeVisible()

    // La nueva contraseña queda activa; la vieja ya no sirve
    await logout(page)
    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('maria.gonzalez@soy.sena.edu.co')
    await page.locator('input[type="password"]').fill('123456')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await expect(page.locator('[role="alert"], .error')).toBeVisible()

    await page.locator('input[type="password"]').fill('nuevaClave123')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await page.waitForURL('**/aprendiz/dashboard')
  })
})
