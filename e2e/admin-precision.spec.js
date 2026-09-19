import { test, expect, login } from './helpers'

test.describe('Admin: precisión y botones', () => {
  test('dashboard lleva al motor y a configuración (sin duplicados)', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/dashboard')
    await page.getByRole('link', { name: /Motor de similitud/i }).click()
    await page.waitForURL('**/admin/config-similitud')

    await page.goto('/admin/dashboard')
    await page.getByRole('main').getByRole('link', { name: /Configuración/i }).click()
    await page.waitForURL('**/admin/configuracion')
    await expect(page.getByText('Redes de conocimiento')).toBeVisible()
    await expect(page.getByText('Centros de formación')).toBeVisible()
    await expect(page.getByText('Motor de similitud')).toBeVisible()
  })

  test('sidebar sin accesos directos a configuración (solo el hub)', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/dashboard')
    await expect(page.locator('aside a[href="/admin/redes-conocimiento"]')).toHaveCount(0)
    await expect(page.locator('aside a[href="/admin/training-centers"]')).toHaveCount(0)
    await expect(page.locator('aside a[href="/admin/config-similitud"]')).toHaveCount(0)
    await expect(page.locator('aside a[href="/admin/configuracion"]')).toHaveCount(1)
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

  test('eliminar red en uso está bloqueado con motivo', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/redes-conocimiento')
    const fila = page.locator('tr', { hasText: 'Informática, Diseño y Desarrollo de Software' })
    const btn = fila.getByRole('button', { name: /Eliminar/i })
    await expect(btn).toBeDisabled()
    await expect(btn).toHaveAttribute('title', /en uso/i)
  })
})
