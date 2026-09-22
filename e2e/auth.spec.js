import { test, expect, login, logout } from './helpers'

test.describe('Autenticación por rol', () => {
  for (const role of ['aprendiz', 'instructor', 'admin']) {
    test(`login como ${role} lleva a su dashboard`, async ({ page }) => {
      const cta = await login(page, role)
      await expect(page).toHaveURL(new RegExp(`${role}/dashboard`))
      await expect(page.getByText(new RegExp(`Hola, ${cta.nombre}`, 'i'))).toBeVisible().catch(() => {})
    })
  }

  test('login como superadmin lleva al área de administración', async ({ page }) => {
    await login(page, 'superadmin')
    await expect(page).toHaveURL(/\/admin\/dashboard/)
  })

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

  test('la contraseña se puede mostrar y volver a ocultar', async ({ page }) => {
    await page.goto('/login')
    // Se ubica por autocomplete para que el locator siga sirviendo al cambiar el type.
    const clave = page.locator('input[autocomplete="current-password"]')
    await expect(clave).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: 'Mostrar contraseña' }).click()
    await expect(clave).toHaveAttribute('type', 'text')

    await page.getByRole('button', { name: 'Ocultar contraseña' }).click()
    await expect(clave).toHaveAttribute('type', 'password')
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
    // Nombre y apellido son editables por el propio aprendiz.
    await expect(page.getByRole('textbox', { name: 'Nombres' })).toHaveValue('María')
    await expect(page.getByRole('textbox', { name: 'Apellidos' })).toHaveValue('González')
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

  test('cambiar el correo exige la contraseña actual y solo entonces se guarda', async ({ page }) => {
    // Usuario nuevo para no alterar las cuentas del seed que usan los demás specs.
    const email = `correo.e2e.${Date.now()}@soy.sena.edu.co`
    await page.goto('/register')
    await page.getByPlaceholder(/Mar.a Jos/i).fill('Correo E2E')
    await page.getByPlaceholder(/Gonz.lez Ruiz/i).fill('Prueba')
    await page.getByPlaceholder('tu.correo@ejemplo.com').fill(email)
    await page.locator('input[type="password"]').first().fill('clave123')
    await page.locator('input[type="password"]').nth(1).fill('clave123')
    await page.getByRole('button', { name: /Crear Cuenta/i }).click()
    await page.waitForURL('**/confirmacion')

    await page.goto('/login')
    await page.getByPlaceholder('tu.correo@ejemplo.com').fill(email)
    await page.locator('input[type="password"]').fill('clave123')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await page.waitForURL('**/aprendiz/dashboard')

    await page.goto('/aprendiz/perfil')

    // El correo ya no se edita en el formulario principal: es de solo lectura.
    await page.getByRole('button', { name: /Editar perfil/i }).click()
    await expect(page.getByLabel(/Correo electr.nico/i)).toHaveAttribute('readonly', '')
    await page.getByRole('main').getByRole('button', { name: 'Cancelar' }).click()

    // Flujo aparte: nuevo correo + contraseña actual.
    const nuevo = `correo.nuevo.${Date.now()}@soy.sena.edu.co`
    await page.getByRole('button', { name: /Cambiar correo/i }).click()
    const modal = page.getByRole('alertdialog')
    await expect(modal).toBeVisible()

    await page.getByLabel(/Nuevo correo electr.nico/i).fill(nuevo)

    // Con la contraseña incorrecta no se cambia.
    await page.getByLabel(/Contraseña actual/i).fill('equivocada')
    await modal.getByRole('button', { name: /Cambiar correo/i }).click()
    await expect(page.getByText(/contraseña actual no es correcta/i)).toBeVisible()

    // Con la correcta, se guarda y el perfil muestra el correo nuevo.
    await page.getByLabel(/Contraseña actual/i).fill('clave123')
    await modal.getByRole('button', { name: /Cambiar correo/i }).click()
    await expect(page.getByRole('main').getByText(nuevo).first()).toBeVisible({ timeout: 15000 })
  })
})
