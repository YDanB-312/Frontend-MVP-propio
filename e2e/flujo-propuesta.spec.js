import { test, expect, login, logout } from './helpers'

// Flujo completo de una propuesta: borrador → envío → rechazo con observación →
// corrección y reenvío → aprobación, con historial visible para el aprendiz.
test('ciclo completo: borrador, envío, rechazo, reenvío y aprobación', async ({ page }) => {
  const sufijo = String(Date.now())
  const titulo = `Flujo completo E2E ${sufijo}`
  const tituloCorregido = `${titulo} con diferencial`

  // 1) Borrador completo (sin enviar).
  await login(page, 'aprendiz')
  await page.goto('/aprendiz/propuestas')
  await page.getByRole('main').getByRole('button', { name: /Nueva propuesta/i }).click()
  await page.getByPlaceholder(/Sistema de monitoreo ambiental/i).fill(titulo)
  await page.locator('textarea').nth(0).fill('Herramienta web para controlar inventarios con alertas de stock y reportes de trazabilidad.')
  await page.locator('textarea').nth(1).fill('Controlar los inventarios del almacén con alertas por stock mínimo.')
  await page.locator('textarea').nth(2).fill('Registrar entradas y salidas de productos.\nGenerar reportes de trazabilidad por lote.')
  await page.locator('select').nth(0).selectOption({ index: 1 })
  await page.getByRole('button', { name: /Guardar borrador/i }).click()
  await expect(page.getByText(titulo)).toBeVisible({ timeout: 15000 })

  // 2) Envío explícito: el motor corre en el servidor.
  await page.getByText(titulo).first().click()
  await page.waitForURL('**/aprendiz/detalle-proyecto/**')
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
  await page.getByLabel(/Observación/i).fill('Agrega un diferencial claro al proyecto.')
  await page.getByRole('button', { name: /Sí, rechazar/i }).click()
  await expect(page.getByRole('button', { name: `Rechazar ${titulo}` })).toHaveCount(0, { timeout: 10000 })

  // 4) El aprendiz corrige y reenvía (sin cambios reales se bloquea).
  await logout(page)
  await login(page, 'aprendiz')
  await page.goto('/aprendiz/propuestas')
  await page.getByText(titulo).first().click()
  await page.waitForURL('**/aprendiz/detalle-proyecto/**')
  await expect(page.getByText('Rechazada por el instructor')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Agrega un diferencial claro al proyecto.').first()).toBeVisible()

  // Reenviar sin cambios → aviso del backend.
  await page.getByRole('button', { name: /Enviar propuesta/i }).click()
  await expect(page.getByText(/No hay cambios respecto a la versión anterior/i)).toBeVisible({ timeout: 15000 })

  // Corregir y reenviar → vuelve a revisión.
  await page.getByRole('button', { name: /^Editar$/ }).click()
  await page.getByLabel('Título').fill(tituloCorregido)
  await page.getByRole('button', { name: /Guardar cambios/i }).click()
  await expect(page.getByText(/Propuesta actualizada/i)).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Enviar propuesta/i }).click()
  await page.waitForURL('**/aprendiz/analizando-proyecto', { timeout: 15000 })
  await page.waitForURL('**/aprendiz/resultado-analisis**', { timeout: 20000 })

  // 5) El instructor aprueba la versión corregida.
  await logout(page)
  await login(page, 'instructor')
  await page.goto('/instructor/revision-propuestas')
  await page.getByPlaceholder(/Título, aprendiz o ficha/i).fill(tituloCorregido)
  const nodoCorregido = page.getByRole('button', { name: tituloCorregido }).first()
  await expect(nodoCorregido).toBeVisible({ timeout: 15000 })
  await nodoCorregido.click()
  await page.getByRole('button', { name: `Aprobar ${tituloCorregido}` }).click()
  await page.getByRole('button', { name: /Sí, aprobar/i }).click()
  await expect(page.getByRole('button', { name: `Aprobar ${tituloCorregido}` })).toHaveCount(0, { timeout: 10000 })

  // 6) El aprendiz ve la aprobación y el historial completo.
  await logout(page)
  await login(page, 'aprendiz')
  await page.goto('/aprendiz/propuestas')
  await page.getByText(tituloCorregido).first().click()
  await page.waitForURL('**/aprendiz/detalle-proyecto/**')
  await expect(page.getByText('Aprobado', { exact: true }).first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Propuesta creada')).toBeVisible()
  await expect(page.getByText('Enviada a revisión').first()).toBeVisible()
  await expect(page.getByText('Rechazada por el instructor').first()).toBeVisible()
  await expect(page.getByText('Reenviada a revisión').first()).toBeVisible()
  await expect(page.getByText('Aprobada', { exact: true }).last()).toBeVisible()
})
