import { test, expect, login, logout } from './helpers'

// Una ficha FINALIZADA queda en solo lectura para los aprendices: pueden ver
// sus propuestas, pero no comentar ni editar.
test('una ficha finalizada es solo lectura para el aprendiz', async ({ page }) => {
  // El admin finaliza la ficha 1.
  await login(page, 'admin')
  await page.goto('/admin/detalle-ficha/1')
  await page.getByRole('button', { name: /Editar/i }).first().click()
  await page.locator('form select[name="estado"]').selectOption('finalizado')
  await page.locator('form').getByRole('button', { name: /Guardar cambios/i }).click()
  await expect(page.getByText('Ficha actualizada correctamente.')).toBeVisible()
  await logout(page)

  // María pertenece a la ficha 1 y ve su propuesta en solo lectura.
  await login(page, 'aprendiz')
  await page.goto('/aprendiz/detalle-proyecto/4')
  await expect(page.getByText('Plataforma de Ventas Online').first()).toBeVisible()
  await expect(page.getByText(/La ficha está finalizada/i)).toBeVisible()

  await expect(page.getByRole('button', { name: /Agregar observación/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Editar', exact: true })).toHaveCount(0)
})
