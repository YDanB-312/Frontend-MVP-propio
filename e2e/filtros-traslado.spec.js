import { test, expect, login } from './helpers'

test.describe('Admin: filtros exactos de usuarios', () => {
  test('filtrar por centro deja solo su gente', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/usuarios')

    await page.getByLabel('Centro').selectOption('1')
    await expect(page.getByText('María González')).toBeVisible()
    await expect(page.getByText('Laura Sánchez Pérez')).toHaveCount(0)

    await page.getByLabel('Programa').selectOption('Produccion Multimedia')
    await expect(page.getByText('María González')).toHaveCount(0)
  })
})

test.describe('Admin: traslado inter-centros', () => {
  test('cambiar de ficha avisa centro y programa, y persiste', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/1')
    await page.getByRole('button', { name: /^Editar$/i }).click()

    await page.locator('select[name="fichaId"]').selectOption('3')
    await expect(page.getByText(/cambia de centro/i)).toBeVisible()
    await expect(page.getByText(/cambia de programa/i)).toBeVisible()

    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.getByText('Usuario actualizado correctamente.')).toBeVisible()

    await page.reload()
    await expect(page.getByText(/Produccion Multimedia 3102/i)).toBeVisible()
  })
})
