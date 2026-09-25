import { test, expect, login } from './helpers'

test.describe('Admin: gestión de fichas', () => {
  test('crear ficha con instructor y centro, y verla en el detalle', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/fichas')
    await page.getByRole('button', { name: /Crear Ficha/i }).click()

    await page.locator('form select[name="red"]').selectOption('Informática, Diseño y Desarrollo de Software')
    await page.locator('form select[name="programa"]').selectOption('ADSO')
    await page.locator('form select[name="instructorId"]').selectOption({ index: 1 })
    await page.getByPlaceholder('Ej. Análisis y Desarrollo 2718').fill('Ficha Admin E2E')
    await page.getByPlaceholder('Ej. 3142101').fill('7777')
    await page.locator('form').getByRole('button', { name: /^Crear ficha$/i }).click()

    await expect(page.getByText('Ficha creada correctamente.')).toBeVisible()
    await expect(page.getByText('Ficha Admin E2E')).toBeVisible()

    await page.getByRole('link', { name: 'Ver' }).first().click()
    await page.waitForURL('**/admin/detalle-ficha/**')
    await expect(page.getByText('Instructor').first()).toBeVisible()
  })

  test('eliminar ficha con datos exige confirmación reforzada y el detalle enlaza', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/fichas')
    const fila = page.locator('tr', { hasText: 'xkp-mqwr' })
    await fila.getByRole('button', { name: /Eliminar/i }).click()

    // El botón de confirmar está deshabilitado hasta aceptar la responsabilidad
    // y escribir ELIMINAR. Se cancela para no borrar la ficha del seed.
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByRole('button', { name: /Sí, eliminar/i })).toBeDisabled()
    await dialog.getByRole('button', { name: /Cancelar/i }).click()

    // Desde una propuesta se llega a su ficha
    await page.goto('/admin/detalle-proyecto/4')
    await page.getByRole('link', { name: /xkp-mqwr/i }).click()
    await page.waitForURL('**/admin/detalle-ficha/**')
  })

  test('finalizar una ficha desde su detalle', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-ficha/2')
    await page.getByRole('button', { name: /Editar/i }).first().click()
    await page.locator('form select[name="estado"]').selectOption('finalizado')
    await page.locator('form').getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.getByText('Ficha actualizada correctamente.')).toBeVisible()
    await expect(page.getByText('Finalizado').first()).toBeVisible()
  })
})
