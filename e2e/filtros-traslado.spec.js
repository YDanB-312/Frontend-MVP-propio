import { test, expect, login } from './helpers'

test.describe('Admin: filtros exactos de usuarios', () => {
  test('filtrar por programa deja solo su gente', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/usuarios')

    await page.getByLabel('Programa').selectOption('Produccion Multimedia')
    await expect(page.getByText('Laura Sánchez Pérez')).toBeVisible()
    await expect(page.getByText('María González')).toHaveCount(0)
  })
})

test.describe('Admin: traslado de ficha', () => {
  test('cambiar de ficha avisa el cambio de programa y persiste', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/1')
    await page.getByRole('button', { name: /^Editar$/i }).click()

    await page.locator('select[name="fichaId"]').selectOption('3')
    await expect(page.getByText(/cambia de programa/i)).toBeVisible()

    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.getByText('Usuario actualizado correctamente.')).toBeVisible()

    await page.reload()
    await expect(page.getByText(/Produccion Multimedia 3102/i)).toBeVisible()
  })
})
