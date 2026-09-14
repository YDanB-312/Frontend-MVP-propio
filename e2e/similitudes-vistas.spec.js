import { test, expect, login } from './helpers'

test.describe('Instructor: similitudes agrupadas por ficha', () => {
  test('muestra grupos colapsables con pares dentro', async ({ page }) => {
    await login(page, 'otro')
    await page.goto('/instructor/similitudes')

    const grupo = page.getByRole('button', { name: /coincidencia/i }).first()
    await expect(grupo).toBeVisible()
    await expect(grupo).toHaveAttribute('aria-expanded', 'true')

    await expect(grupo).toContainText(/coincidencia/)
    await expect(page.getByRole('link', { name: /^Ver$/i }).first()).toBeVisible()

    await grupo.click()
    await expect(grupo).toHaveAttribute('aria-expanded', 'false')
    await grupo.click()
    await expect(grupo).toHaveAttribute('aria-expanded', 'true')
  })
})

test.describe('Admin: tira resumen de similitudes', () => {
  test('muestra pares, altas, programas y umbral', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/similitudes')

    const tira = page.getByRole('status', { name: /Resumen de coincidencias/i })
    await expect(tira).toBeVisible()
    await expect(tira.getByText('Pares', { exact: true })).toBeVisible()
    await expect(tira.getByText('Sobre 70%', { exact: true })).toBeVisible()
    await expect(tira.getByText('Programas', { exact: true })).toBeVisible()
    await expect(tira.getByText('Umbral', { exact: true })).toBeVisible()
    await expect(tira.getByText('20%', { exact: true })).toBeVisible()
  })
})
