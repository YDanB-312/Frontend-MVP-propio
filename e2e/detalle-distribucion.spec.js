import { test, expect, login } from './helpers'

test.describe('Distribución de detalles y accesos', () => {
  test('detalle instructor usa rail lateral', async ({ page }) => {
    await login(page, 'instructor')
    await page.goto('/instructor/detalle-proyecto/4')
    await expect(page.locator('aside[aria-label="Aprendiz, similitudes y observaciones"]')).toBeVisible()
  })

  test('detalle admin usa rail lateral', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-proyecto/4')
    await expect(page.locator('aside[aria-label="Aprendiz, similitudes y observaciones"]')).toBeVisible()
  })

test('seguridad enlaza a recuperación por correo', async ({ page }) => {
  await login(page, 'aprendiz')
  await page.goto('/aprendiz/perfil')
  await page.getByRole('link', { name: /Recupérala por correo/i }).click()
  await page.waitForURL('**/recuperar-contrasena')
  await expect(page.getByRole('heading', { name: /Recuperar contraseña/i })).toBeVisible()
})

  test('detalle de ficha aprendiz lista sus propuestas', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/detalle-ficha/1')
    await expect(page.getByText(/Propuestas de la ficha \(/i)).toBeVisible()
    await expect(page.getByText('Plataforma de Ventas Online')).toBeVisible()
  })

  test('detalle de ficha instructor lista sus propuestas', async ({ page }) => {
    await login(page, 'instructor')
    await page.goto('/instructor/detalle-ficha/1')
    await expect(page.getByText(/Propuestas de la ficha \(/i)).toBeVisible()
    await expect(page.getByText('Plataforma de Ventas Online')).toBeVisible()
  })
})
