import { test, expect, login, logout } from './helpers'

// El historial del proyecto (project_histories) conserva la evolución: creación,
// edición, envío, rechazo con observación, reenvío y aprobación.
test('el historial registra creación, edición, envío y rechazo con observación', async ({ page }) => {
  const titulo = `Historial E2E ${Date.now()}`

  // 1) Borrador: el historial registra la creación.
  await login(page, 'aprendiz')
  await page.goto('/aprendiz/propuestas')
  await page.getByRole('main').getByRole('button', { name: /Nueva propuesta/i }).click()
  await page.getByPlaceholder(/Sistema de monitoreo ambiental/i).fill(titulo)
  await page.getByRole('button', { name: /Guardar borrador/i }).click()

  await expect(page.getByText(titulo)).toBeVisible({ timeout: 15000 })
  await page.getByText(titulo).first().click()
  await page.waitForURL('**/aprendiz/detalle-proyecto/**')
  await expect(page.getByText('Propuesta creada')).toBeVisible()
  await expect(page.getByText('Enviada a revisión')).toHaveCount(0)

  // 2) Completar y enviar: el historial registra la edición y el envío.
  await page.getByRole('button', { name: /^Editar$/ }).click()
  await page.getByLabel('Descripción').fill('Descripción suficientemente larga para la propuesta de historial E2E.')
  await page.getByLabel('Objetivo general').fill('Validar el historial completo de la propuesta.')
  await page.getByLabel('Objetivos específicos').fill('Registrar la creación.\nRegistrar el envío y la revisión.')
  await page.getByLabel('Área de aplicación').fill('Desarrollo Web')
  await page.getByRole('button', { name: /Guardar cambios/i }).click()
  await expect(page.getByText(/Propuesta actualizada/i)).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Contenido actualizado')).toBeVisible()

  await page.getByRole('button', { name: /Enviar propuesta/i }).click()
  await page.waitForURL('**/aprendiz/analizando-proyecto', { timeout: 15000 })
  await page.waitForURL('**/aprendiz/resultado-analisis**', { timeout: 20000 })

  // 3) El instructor rechaza con observación.
  await logout(page)
  await login(page, 'instructor')
  await page.goto('/instructor/revision-propuestas')
  await page.getByPlaceholder(/Título, aprendiz o ficha/i).fill(titulo)
  const nodo = page.getByRole('button', { name: titulo }).first()
  await expect(nodo).toBeVisible({ timeout: 15000 })
  await nodo.click()
  await page.getByRole('button', { name: `Rechazar ${titulo}` }).click()
  await page.getByLabel(/Observación/i).fill('Falta el diferencial del proyecto.')
  await page.getByRole('button', { name: /Sí, rechazar/i }).click()

  // 4) El aprendiz ve el rechazo y la observación en el historial.
  await logout(page)
  await login(page, 'aprendiz')
  await page.goto('/aprendiz/propuestas')
  await page.getByText(titulo).first().click()
  await page.waitForURL('**/aprendiz/detalle-proyecto/**')
  await expect(page.getByText('Rechazada por el instructor')).toBeVisible({ timeout: 15000 })
  // La observación queda tanto en el hilo de comentarios como en el historial.
  await expect(page.getByText('Falta el diferencial del proyecto.').first()).toBeVisible()
})
