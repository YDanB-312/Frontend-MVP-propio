// Playbook del agente APRENDIZ: propuestas (crear/editar/comentar), fichas,
// alertas, perfil y reporte de fallas. Datos propios (sufijo único).
import { expect } from '@playwright/test'

export async function aprendiz(h) {
  const { page } = h
  const titulo = `Propuesta Agente ${h.sufijo}`
  const tituloEditado = `${titulo} (editada)`

  await h.paso('crear propuesta', async () => {
    await h.ir('/aprendiz/propuestas')
    await h.auditar()
    h.usar('Nueva propuesta')
    await page.getByRole('main').getByRole('button', { name: /Nueva propuesta/i }).click()

    await page.getByPlaceholder(/Sistema de monitoreo ambiental/i).fill(titulo)
    await page.locator('textarea').nth(0).fill('Propuesta creada por el agente autónomo para validar el registro completo de propuestas en la plataforma.')
    await page.locator('textarea').nth(1).fill('Validar el registro y la edición de propuestas por parte del aprendiz.')
    await page.locator('textarea').nth(2).fill('Registrar la propuesta desde el formulario.\nVerificar el análisis de similitud posterior.')
    await page.locator('select').nth(0).selectOption({ index: 1 })
    await page.getByRole('button', { name: /Enviar propuesta/i }).click()

    await page.waitForURL('**/aprendiz/analizando-proyecto', { timeout: 15000 })
    await page.waitForURL('**/aprendiz/resultado-analisis**', { timeout: 20000 })
  })

  await h.paso('editar propuesta propia', async () => {
    await h.ir('/aprendiz/propuestas')
    await page.getByText(titulo, { exact: false }).first().click()
    await page.waitForURL('**/aprendiz/detalle-proyecto/**')

    h.usar('Editar')
    await page.getByRole('button', { name: /^Editar$/i }).click()
    await page.getByLabel('Título').fill(tituloEditado)
    h.usar('Guardar cambios')
    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await h.esperar(tituloEditado)
  })

  await h.paso('comentar propuesta', async () => {
    h.usar('Agregar observación')
    await page.getByLabel('Escribe un comentario sobre la propuesta').fill(`Comentario del agente ${h.sufijo}.`)
    await page.getByRole('button', { name: /Agregar observación/i }).click()
    await h.esperar(`Comentario del agente ${h.sufijo}.`)
  })

  await h.paso('salir y unirse a otra ficha', async () => {
    await h.ir('/aprendiz/ficha')
    await h.auditar()
    h.usar('Salir de la ficha')
    await page.getByRole('button', { name: /Salir de la ficha/i }).click()
    await page.getByRole('button', { name: /Sí, salir/i }).click()

    h.usar('Buscar ficha')
    await page.getByLabel(/Código de la ficha/i).fill('bnt-jhsa')
    await page.getByRole('button', { name: /Buscar ficha/i }).click()
    h.usar('Unirme a esta ficha')
    await page.getByRole('button', { name: /Unirme a esta ficha/i }).click()
    await h.esperar('Analisis y Desarrollo 2634', 15000)
  })

  await h.paso('marcar alertas como leídas', async () => {
    await h.ir('/aprendiz/alertas')
    const btn = page.getByRole('button', { name: /Marcar todas como leídas/i })
    await btn.waitFor({ timeout: 10000 })
    if (await btn.isEnabled()) await btn.click()
    await expect(btn).toBeDisabled({ timeout: 10000 })
  })

  await h.paso('editar mi perfil', async () => {
    await h.ir('/aprendiz/perfil')
    h.usar('Editar perfil')
    await page.getByRole('button', { name: /Editar perfil/i }).click()
    await page.getByRole('textbox', { name: 'Nombres' }).fill(`María ${h.sufijo}`)
    h.usar('Guardar cambios')
    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await h.esperar('Tus datos se actualizaron correctamente.', 10000)
  })

  await h.paso('reportar falla', async () => {
    await h.ir('/aprendiz/reportar-falla')
    await page.getByLabel(/Título del reporte/i).fill(`Falla agente ${h.sufijo}`)
    await page.getByLabel(/Descripción/i).fill('Reporte creado automáticamente por el agente para validar el flujo de reportes de falla de punta a punta.')
    h.usar('Enviar reporte')
    await page.getByRole('button', { name: /Enviar reporte/i }).click()
    await h.esperar('Gracias por reportar', 10000)
  })
}
