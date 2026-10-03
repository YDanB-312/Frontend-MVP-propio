import { test, expect, login } from './helpers'

test.describe('Soporte de punta a punta', () => {
  test('aprendiz crea una solicitud con validación y ve confirmación', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/reportar-falla')
    // La descripción es obligatoria: enviar vacío no confirma nada.
    await page.getByRole('button', { name: /Enviar solicitud/i }).click()
    await expect(page.getByText(/Gracias por escribirnos/i)).toHaveCount(0)

    await page.getByLabel(/Título de la solicitud/i).fill('Soporte E2E de navegación')
    await page.getByLabel(/Descripción/i).fill('Al abrir el detalle de una propuesta la página queda en blanco en móvil.')
    await page.getByRole('button', { name: /Enviar solicitud/i }).click()
    await expect(page.getByText(/Gracias por escribirnos/i)).toBeVisible()
  })

  test('admin ve la solicitud de ficha y la cierra con respuesta', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/reportar-falla')
    await page.getByLabel(/Número de ficha/i).fill('3142101')
    await page.getByLabel(/Motivo/i).fill('El número ya está registrado')
    await page.getByLabel(/Descripción/i).fill('Necesito crear la ficha 3142101 y el sistema dice que ya existe.')
    await page.getByRole('button', { name: /Enviar solicitud/i }).click()
    await expect(page.getByText(/Gracias por escribirnos/i)).toBeVisible()

    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await page.waitForURL('**/login')
    await login(page, 'admin')
    await page.goto('/admin/reportes-fallas')
    await page.getByPlaceholder(/Título, número de ficha, #id o reportante/i).fill('3142101')
    await page.locator('tr', { hasText: '3142101' }).getByRole('link', { name: /Ver/i }).click()
    await page.waitForURL('**/admin/detalle-reporte/**')

    await page.getByLabel('Cambiar estado').selectOption('resuelto')
    await page.getByLabel(/Respuesta al solicitante/i).fill('Se anuló la ficha duplicada; el número quedó libre.')
    await page.getByRole('button', { name: /^Guardar$/ }).click()
    await expect(page.getByText(/se actualizó correctamente/i)).toBeVisible()
    await expect(page.getByLabel('Cambiar estado')).toHaveValue('resuelto')
  })
})
