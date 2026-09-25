import { test, expect, login, confirmarBorrado } from './helpers'

test.describe('Admin: eliminar usuarios', () => {
  test('un usuario con propuestas exige confirmación reforzada', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/1')
    await page.getByRole('button', { name: /^Eliminar$/i }).click()

    // El botón de confirmar está bloqueado hasta aceptar y escribir ELIMINAR.
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByRole('button', { name: /Sí, eliminar/i })).toBeDisabled()
    await dialog.getByRole('button', { name: /Cancelar/i }).click()
  })

  test('un instructor con fichas a cargo exige confirmación reforzada', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/8') // Andrés: instructor con ficha
    await page.getByRole('button', { name: /^Eliminar$/i }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByRole('button', { name: /Sí, eliminar/i })).toBeDisabled()
    await dialog.getByRole('button', { name: /Cancelar/i }).click()
  })

  test('elimina con confirmación reforzada y vuelve al listado', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/12')
    await page.getByRole('button', { name: /^Eliminar$/i }).click()
    await expect(page.getByText(/Eliminar usuario/i)).toBeVisible()
    await confirmarBorrado(page, 'ELIMINAR')
    await page.waitForURL('**/admin/usuarios')
    await page.getByPlaceholder('Nombre o correo…').fill('maria.torres@sena.edu.co')
    await expect(page.locator('tbody tr')).toHaveCount(0)
  })

  test('editar a un correo existente muestra error', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-usuario/9')
    await page.getByRole('button', { name: /^Editar$/i }).click()
    await page.getByLabel('Correo electrónico').fill('maria.gonzalez@soy.sena.edu.co')
    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.getByText(/Ya existe un usuario/i)).toBeVisible()
  })
})
