import { test, expect, login } from './helpers'

test.describe('Paginación de listas', () => {
  test('avanza páginas y el filtro resetea a la primera', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/usuarios')

    const nav = page.getByRole('navigation', { name: /Paginación/i })
    // Se valida la paginación sin fijar el conteo exacto (robusto ante el seed).
    await expect(nav.getByText(/Mostrando 1–8 de \d+ usuarios/)).toBeVisible()
    await nav.getByRole('button', { name: /Página siguiente/i }).click()
    await expect(nav.getByText(/Mostrando 9–\d+ de \d+ usuarios/)).toBeVisible()
    await nav.getByRole('button', { name: /2/, exact: true }).click()
    await expect(nav.getByRole('button', { name: /2/, exact: true })).toHaveAttribute('aria-current', 'page')

    await page.getByPlaceholder('Nombre o correo…').fill('maria')
    await expect(nav.getByText(/Mostrando 1–/)).toBeVisible()
    await expect(nav.getByRole('button', { name: /Página siguiente/i })).toBeDisabled()
  })
})
