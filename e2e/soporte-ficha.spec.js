import { test, expect, login } from './helpers'

// Conflicto de número de ficha: el instructor pide soporte desde el formulario
// y el admin cierra la solicitud con una respuesta.
test('número de ficha ocupado → solicitud de soporte → resolución del admin', async ({ page }) => {
  const descripcion = `Necesito crear la ficha con el número ocupado (E2E ${Date.now()}).`

  // 1) El instructor intenta crear una ficha con un número ya registrado.
  await login(page, 'instructor')
  await page.goto('/instructor/fichas?crear=1')
  await page.locator('form select[name="red"]').selectOption('Informática, Diseño y Desarrollo de Software')
  await page.locator('form select[name="programaId"]').selectOption({ label: 'ADSO' })
  await page.getByPlaceholder('Ej. Análisis y Desarrollo 2718').fill('Ficha con número ocupado')
  await page.getByPlaceholder('Ej. 3142101').fill('2568') // número del seed
  await page.locator('form').getByRole('button', { name: /^Crear ficha$/i }).click()

  // 2) Se ofrece crear la solicitud de soporte con el número precargado.
  await expect(page.getByText(/ya está registrado/i)).toBeVisible()
  await page.getByRole('link', { name: /Solicitar soporte/i }).click()
  await page.waitForURL('**/instructor/reportar-falla?numero=2568')
  await expect(page.getByLabel(/Número de ficha/i)).toHaveValue('2568')

  await page.getByLabel(/Descripción/i).fill(descripcion)
  await page.getByRole('button', { name: /Enviar solicitud/i }).click()
  await expect(page.getByText(/Gracias por escribirnos/i)).toBeVisible()

  // 3) El admin la ve en Soporte y la cierra con respuesta.
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await page.waitForURL('**/login')
  await login(page, 'admin')
  await page.goto('/admin/reportes-fallas')
  await page.getByPlaceholder(/Título, número de ficha, #id o reportante/i).fill('2568')
  await page.locator('tr', { hasText: '2568' }).first().getByRole('link', { name: /Ver/i }).click()
  await page.waitForURL('**/admin/detalle-reporte/**')

  await expect(page.getByText('2568').first()).toBeVisible()
  await page.getByLabel('Cambiar estado').selectOption('resuelto')
  await page.getByLabel(/Respuesta al solicitante/i).fill('La ficha duplicada quedó anulada; el número está libre.')
  await page.getByRole('button', { name: /^Guardar$/ }).click()
  await expect(page.getByText(/se actualizó correctamente/i)).toBeVisible()
  await expect(page.getByText(/Respuesta enviada/i)).toBeVisible()
})
