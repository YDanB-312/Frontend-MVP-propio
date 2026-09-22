import { test, expect, login } from './helpers'

test.describe('Traslados de ficha extendidos', () => {
  test('mismo centro y programa no muestra avisos y persiste', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/1')
    await page.getByRole('button', { name: /^Editar$/i }).click()
    await page.getByLabel('Ficha').selectOption('2')
    await expect(page.getByText(/Este traslado/i)).toHaveCount(0)
    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.getByText('Usuario actualizado correctamente.')).toBeVisible()
  })

  test('quitar la ficha deja Sin ficha asignada', async ({ page }) => {
    // Sacar a un aprendiz de toda ficha lo deja sin centro: es gobernanza.
    await login(page, 'superadmin')
    await page.goto('/admin/detalle-usuario/5')
    await page.getByRole('button', { name: /^Editar$/i }).click()
    await page.getByLabel('Ficha').selectOption('')
    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.getByText('Usuario actualizado correctamente.')).toBeVisible()
    await expect(page.getByText('Sin ficha asignada')).toBeVisible()
  })

  test('las propuestas conservan su ficha original tras el traslado', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/1')
    await page.getByRole('button', { name: /^Editar$/i }).click()
    await page.getByLabel('Ficha').selectOption('2')
    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.getByText('Usuario actualizado correctamente.')).toBeVisible()

    await page.goto('/admin/detalle-proyecto/4')
    await expect(page.getByText(/xkp-mqwr/i).first()).toBeVisible()
  })
})
