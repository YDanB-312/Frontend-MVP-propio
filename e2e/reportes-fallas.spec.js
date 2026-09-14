import { test, expect, login } from './helpers'

test.describe('Reportes de falla de punta a punta', () => {
  test('aprendiz crea reporte con validación y ve confirmación', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/reportar-falla')
    await expect(page.getByLabel(/Título del reporte/i)).toHaveAttribute('required', '')
    await page.getByRole('button', { name: /Enviar reporte/i }).click()
    await expect(page.getByText(/Gracias por reportar/i)).toHaveCount(0)

    await page.getByLabel(/Título del reporte/i).fill('Falla E2E de navegación')
    await page.getByLabel(/Descripción/i).fill('Al abrir el detalle de una propuesta la página queda en blanco en móvil.')
    await page.getByRole('button', { name: /Enviar reporte/i }).click()
    await expect(page.getByText(/Gracias por reportar/i)).toBeVisible()
  })

  test('admin ve el reporte y cambia su estado', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/reportar-falla')
    await page.getByLabel(/Título del reporte/i).fill('Reporte E2E para admin')
    await page.getByLabel(/Descripción/i).fill('Descripción suficiente del problema detectado.')
    await page.getByRole('button', { name: /Enviar reporte/i }).click()
    await expect(page.getByText(/Gracias por reportar/i)).toBeVisible()

    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await page.waitForURL('**/login')
    await login(page, 'admin')
    await page.goto('/admin/reportes-fallas')
    await page.getByPlaceholder(/Título, #id o reportante/i).fill('Reporte E2E para admin')
    await page.locator('tr', { hasText: 'Reporte E2E para admin' }).getByRole('link', { name: /Ver/i }).click()
    await page.waitForURL('**/admin/detalle-reporte/**')

    await page.getByLabel('Cambiar estado').selectOption('resuelto')
    await page.getByRole('button', { name: /Guardar estado/i }).click()
    await expect(page.getByText(/se actualizó correctamente/i)).toBeVisible()
    await expect(page.getByLabel('Cambiar estado')).toHaveValue('resuelto')
  })
})
