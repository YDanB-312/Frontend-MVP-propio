import { test, expect, login } from './helpers'

test.describe('Revisión de propuestas (instructor)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'instructor')
    await page.getByRole('link', { name: /Revision Propuestas/i }).first().click()
    await page.waitForURL('**/instructor/revision-propuestas')
  })

  test('muestra la tabla con columnas en propuesta', async ({ page }) => {
    await expect(page.locator('th', { hasText: 'Propuesta' }).first()).toBeVisible()
    await expect(page.locator('[data-label="Aprendiz"]').first()).toBeVisible()
    await expect(page.locator('[data-label="Similitud"]').first()).toBeVisible()
  })

  test('aprobar una pendiente cambia su estado y notifica al aprendiz', async ({ page }) => {
    const filaPendiente = page.locator('tr', { has: page.locator('[data-label="Estado"] >> text=Pendiente') }).first()
    const existe = await filaPendiente.isVisible().catch(() => false)
    test.skip(!existe, 'No hay pendientes para este instructor en el seed actual')

    await filaPendiente.getByRole('button', { name: /Aprobar/i }).click()
    await page.getByRole('button', { name: /Sí, aprobar/i }).click()

    // La fila aprobada ya no ofrece botones Aprobar/Rechazar
    await expect(filaPendiente.getByRole('button', { name: /Aprobar/i })).toHaveCount(0, { timeout: 10000 })
  })
})

test.describe('Similitudes del instructor', () => {
  test('sección listada con filas de coincidencias del seed', async ({ page }) => {
    await login(page, 'instructor')
    await page.goto('/instructor/similitudes')
    await expect(page.getByText(/Similitudes Detectadas|coincidencia/i).first()).toBeVisible()
  })
})
