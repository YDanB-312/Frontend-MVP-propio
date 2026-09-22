import { test, expect, login } from './helpers'

test.describe('Admin: motor de similitudes', () => {
  test('umbral y ventana visibles, ajustables y recalibrables', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/similitudes')
    await expect(page.getByText(/Umbral 20% · corpus de 12 meses/i)).toBeVisible()

    await page.goto('/admin/config-similitud')
    await expect(page.getByText(/Umbral: 20% · Ventana: 12 meses/i)).toBeVisible()

    await page.locator('input[type="number"]').first().fill('80')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await page.getByRole('button', { name: /Guardar parámetros/i }).click()
    await expect(page.getByText(/umbral 80% y ventana de 6 meses/i)).toBeVisible()

    await page.getByRole('button', { name: /Recalcular base existente/i }).click()
    await page.getByRole('button', { name: /Sí, recalcular/i }).click()
    await expect(page.getByText(/Recalibración lista/i)).toBeVisible()
    await expect(page.getByText(/Umbral: 80% · Ventana: 6 meses/i)).toBeVisible()
  })
})
