import { test, expect, login, logout } from './helpers'

test.describe('Admin: suspender y reactivar', () => {
  test('suspender bloquea el login y reactivar lo permite', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/usuarios')
    await page.getByPlaceholder('Nombre o correo…').fill('juan.perez@soy.sena.edu.co')
    const fila = page.locator('tr', { hasText: 'juan.perez@soy.sena.edu.co' })
    await fila.getByRole('button', { name: /Suspender/i }).click()
    await expect(fila.getByText('Suspendido')).toBeVisible()

    await logout(page)
    await page.goto('/login')
    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('juan.perez@soy.sena.edu.co')
    await page.locator('input[type="password"]').fill('123456')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await expect(page.locator('[role="alert"], .error')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)

    await login(page, 'admin')
    await page.goto('/admin/usuarios')
    await page.getByPlaceholder('Nombre o correo…').fill('juan.perez@soy.sena.edu.co')
    await page.locator('tr', { hasText: 'juan.perez@soy.sena.edu.co' }).getByRole('button', { name: /Activar/i }).click()
    await expect(page.locator('tr', { hasText: 'juan.perez@soy.sena.edu.co' }).getByText('Activo')).toBeVisible()
  })
})

test.describe('Admin: rol y contraseña', () => {
  test('cambiar rol y restablecer clave temporal', async ({ page }) => {
    await login(page, 'superadmin')
    await page.goto('/admin/detalle-usuario/9')
    await page.getByRole('button', { name: /^Editar$/i }).click()
    // Idempotente: si ya es instructor (reintento con la misma DB) no se guarda.
    const selectRol = page.locator('select[name="role"]')
    const rolActual = await selectRol.inputValue()
    if (rolActual !== 'instructor') {
      await selectRol.selectOption('instructor')
      await page.getByRole('button', { name: /Guardar cambios/i }).click()
    } else {
      await page.getByRole('button', { name: /Cancelar/i }).click()
    }
    // El estado final es lo que importa (el aviso de éxito es transitorio).
    await expect(page.getByText('Instructor', { exact: true }).first()).toBeVisible()

    await page.getByRole('button', { name: /Restablecer contraseña/i }).click()
    const alerta = page.getByText(/contraseña temporal/i)
    await expect(alerta).toBeVisible()
    const texto = await alerta.innerText()
    const temporal = texto.match(/sena-[a-z0-9]+/i)?.[0]?.trim() || ''
    expect(temporal.length).toBeGreaterThan(0)

    await logout(page)
    await page.goto('/login')
    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('laura.sanchez@soy.sena.edu.co')
    await page.locator('input[type="password"]').fill(temporal)
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await page.waitForURL('**/instructor/dashboard', { timeout: 15000 })
  })
})

test.describe('Admin: editar propuesta y moderar hilo', () => {
  test('edita contenido y elimina una observación con confirmación', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-proyecto/4')
    await page.getByRole('button', { name: /^Editar$/i }).click()
    await page.getByLabel('Título').fill('Plataforma de Ventas Online E2E')
    await page.getByRole('button', { name: /Guardar contenido/i }).click()
    await expect(page.getByText('Contenido actualizado correctamente.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Plataforma de Ventas Online E2E' })).toBeVisible()

    // Se toma la primera observación de Carlos Ruiz y se verifica que su texto
    // desaparezca del hilo (robusto frente al estado previo de la base).
    const tarjeta = page.locator('article', { hasText: 'Carlos Ruiz' }).first()
    const texto = (await tarjeta.innerText()).trim()
    await tarjeta.getByRole('button', { name: /Eliminar observación/i }).click()
    await page.getByRole('button', { name: /Sí, eliminar/i }).click()
    await expect(page.getByText(texto)).toHaveCount(0)
  })
})
