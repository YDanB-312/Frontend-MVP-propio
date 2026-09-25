import { test, expect, login } from './helpers'

test.describe('Admin: precisión y botones', () => {
  test('dashboard lleva al motor de similitud', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/dashboard')
    await page.getByRole('link', { name: /Motor de similitud/i }).first().click()
    await page.waitForURL('**/admin/config-similitud')
  })

  test('sidebar admin solo con el motor; sin accesos globales', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/dashboard')
    await expect(page.locator('aside a[href="/admin/redes-conocimiento"]')).toHaveCount(0)
    await expect(page.locator('aside a[href="/admin/training-centers"]')).toHaveCount(0)
    await expect(page.locator('aside a[href="/admin/configuracion"]')).toHaveCount(0)
    await expect(page.locator('aside a[href="/admin/config-similitud"]')).toHaveCount(1)
  })

  test('búsqueda ignora tildes y limpiar filtros restaura', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/usuarios')
    await page.getByPlaceholder('Nombre o correo…').fill('maria')
    await expect(page.getByText('María González')).toBeVisible()

    await page.getByPlaceholder('Nombre o correo…').fill('zzz-sin-resultados')
    await expect(page.getByText('María González')).toHaveCount(0)
    await page.getByRole('button', { name: /Limpiar filtros/i }).click()
    await expect(page.getByText('María González')).toBeVisible()
  })

  test('similitudes se buscan por título y filtran por programa', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/similitudes')
    await page.getByPlaceholder('Título o aprendiz…').fill('inventarios')
    await expect(page.getByText(/Sistema de Gestión de Inventarios/i).first()).toBeVisible()

    await page.getByPlaceholder('Título o aprendiz…').fill('')
    await page.getByLabel('Programa').selectOption('ADSO')
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })

  test('eliminar red en uso exige confirmación reforzada', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/redes-conocimiento')
    const fila = page.locator('tr', { hasText: 'Informática, Diseño y Desarrollo de Software' })
    await fila.getByRole('button', { name: /Eliminar/i }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByRole('button', { name: /Sí, eliminar/i })).toBeDisabled()
    await dialog.getByRole('button', { name: /Cancelar/i }).click()
  })
})

