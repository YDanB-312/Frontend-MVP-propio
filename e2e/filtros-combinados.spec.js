import { test, expect, login } from './helpers'

test.describe('Admin: filtros combinados', () => {
  test('rol + programa aísla a la aprendiz de otro programa', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/usuarios')
    const rail = page.locator('aside[aria-label="Filtros de usuarios"]')
    await rail.locator('select').nth(0).selectOption('aprendiz')
    await rail.locator('select').nth(3).selectOption('Produccion Multimedia')
    await expect(page.getByText('Laura Sánchez Pérez')).toBeVisible()
    await expect(page.getByText('María González')).toHaveCount(0)

    await page.getByRole('button', { name: /Limpiar filtros/i }).click()
    await expect(page.getByText('María González')).toBeVisible()
  })

  test('centro + ficha encadenados filtran juntos', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/usuarios')
    const rail = page.locator('aside[aria-label="Filtros de usuarios"]')
    await rail.locator('select').nth(1).selectOption('1')
    await rail.locator('select').nth(2).selectOption('2')
    await expect(page.getByText('Laura Gómez')).toBeVisible()
    await expect(page.getByText('María González')).toHaveCount(0)
  })

  test('proyectos: estado + programa sin resultados y limpiar restaura', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/proyectos')
    await page.getByLabel('Estado').selectOption('rechazado')
    await page.getByLabel('Programa').selectOption('Produccion Multimedia')
    await expect(page.getByText(/Ninguna propuesta coincide/i)).toBeVisible()

    await page.getByRole('button', { name: /Limpiar filtros/i }).click()
    await expect(page.getByText(/Sistema de Gestión de Inventarios/i)).toBeVisible()
  })
})
