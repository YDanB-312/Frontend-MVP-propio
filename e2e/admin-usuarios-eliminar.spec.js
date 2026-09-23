import { test, expect, login } from './helpers'

test.describe('Admin: eliminar usuarios', () => {
  test('con propuestas el botón está bloqueado con motivo', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/1')
    const btn = page.getByRole('button', { name: /^Eliminar$/i })
    await expect(btn).toBeDisabled()
    await expect(btn).toHaveAttribute('title', /propuesta/i)
    // El motivo también se muestra en pantalla, no solo en el tooltip.
    await expect(page.getByText(/No se puede eliminar/i)).toBeVisible()
  })

  test('un instructor con fichas a cargo tampoco se puede eliminar', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/8') // Andrés: instructor con ficha y sin propuestas asignadas
    const btn = page.getByRole('button', { name: /^Eliminar$/i })
    await expect(btn).toBeDisabled()
    await expect(btn).toHaveAttribute('title', /ficha/i)
    await expect(page.getByText(/No se puede eliminar/i)).toBeVisible()
  })

  test('sin propuestas elimina con confirmación y vuelve al listado', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/12')
    await page.getByRole('button', { name: /^Eliminar$/i }).click()
    await expect(page.getByText(/Eliminar usuario/i)).toBeVisible()
    await page.getByRole('button', { name: /Sí, eliminar/i }).click()
    await page.waitForURL('**/admin/usuarios')
    await page.getByPlaceholder('Nombre o correo…').fill('maria.torres@sena.edu.co')
    await expect(page.locator('tbody tr')).toHaveCount(0)
  })

  test('editar a un correo existente muestra error', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/9')
    await page.getByRole('button', { name: /^Editar$/i }).click()
    await page.getByLabel('Correo electrónico').fill('maria.gonzalez@soy.sena.edu.co')
    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.getByText(/Ya existe un usuario/i)).toBeVisible()
  })
})

