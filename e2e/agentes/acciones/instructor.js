// Playbook del agente INSTRUCTOR: fichas (crear/editar/archivar/borrar),
// revisión (aprobar/rechazar), similitudes, alertas y reporte de fallas.
import { expect } from '@playwright/test'

export async function instructor(h) {
  const { page } = h
  const nombreFicha = `Ficha Agente ${h.sufijo}`
  let fichaId = null

  await h.paso('crear ficha', async () => {
    await h.ir('/instructor/fichas?crear=1')
    await h.auditar()
    await page.locator('form select[name="red"]').selectOption('Informática, Diseño y Desarrollo de Software')
    await page.locator('form select[name="programaId"]').selectOption({ label: 'ADSO' })
    await page.locator('form select[name="centroId"]').selectOption({ index: 1 })
    await page.getByPlaceholder('Ej. Análisis y Desarrollo 2718').fill(nombreFicha)
    await page.getByPlaceholder('Ej. 3142101').fill('9' + h.sufijo.slice(0, 4))

    h.usar('Crear ficha')
    const creada = await h.capturar('POST', '/v1/class-groups', () =>
      page.locator('form').getByRole('button', { name: /^Crear ficha$/i }).click()
    )
    fichaId = creada?.id ?? null
    await h.esperar('Ficha creada correctamente.', 10000)
  })

  await h.paso('editar, archivar y borrar la ficha creada', async () => {
    if (!fichaId) throw new Error('no se obtuvo el id de la ficha creada')
    await h.ir(`/instructor/detalle-ficha/${fichaId}`)

    h.usar('Editar')
    await page.getByRole('button', { name: /^Editar$/i }).first().click()
    await page.locator('form select[name="estado"]').selectOption('archivado')
    h.usar('Guardar cambios')
    await page.locator('form').getByRole('button', { name: /Guardar cambios/i }).click()
    // El detalle del instructor cierra el formulario al guardar (sin toast).
    await page.locator('form select[name="estado"]').waitFor({ state: 'detached', timeout: 10000 })

    h.usar('Eliminar ficha')
    await page.getByRole('button', { name: /Eliminar ficha/i }).click()
    await page.getByRole('button', { name: /Sí, eliminar/i }).click()
    await page.waitForURL('**/instructor/fichas', { timeout: 15000 })
  })

  await h.paso('aprobar una propuesta pendiente', async () => {
    await h.ir('/instructor/revision-propuestas')
    await h.auditar()
    const cola = page.getByRole('list', { name: /Cola de revisión/i })
    const nodo = cola.getByRole('button', { name: /Pendiente/ }).first()
    if ((await nodo.count()) === 0) return // no hay pendientes en este seed

    await nodo.click()
    h.usar('Aprobar')
    await page.getByRole('button', { name: /^Aprobar /i }).click()
    await page.getByRole('button', { name: /Sí, aprobar/i }).click()
    await page.getByRole('button', { name: /^Aprobar /i }).waitFor({ state: 'detached', timeout: 10000 })
  })

  await h.paso('rechazar una propuesta pendiente', async () => {
    await h.ir('/instructor/revision-propuestas')
    const cola = page.getByRole('list', { name: /Cola de revisión/i })
    const nodo = cola.getByRole('button', { name: /Pendiente/ }).first()
    if ((await nodo.count()) === 0) return

    await nodo.click()
    h.usar('Rechazar')
    await page.getByRole('button', { name: /^Rechazar /i }).click()
    await page.getByRole('button', { name: /Sí, rechazar/i }).click()
    await page.getByRole('button', { name: /^Rechazar /i }).waitFor({ state: 'detached', timeout: 10000 })
  })

  await h.paso('abrir una similitud', async () => {
    await h.ir('/instructor/similitudes')
    const ver = page.getByRole('link', { name: /^Ver$/i }).first()
    await ver.waitFor({ timeout: 10000 })
    await ver.click()
    await page.waitForURL('**/instructor/detalle-similitud/**', { timeout: 15000 })
  })

  await h.paso('marcar alertas como leídas', async () => {
    await h.ir('/instructor/alertas')
    const btn = page.getByRole('button', { name: /Marcar todas como leídas/i })
    await btn.waitFor({ timeout: 10000 })
    if (await btn.isEnabled()) await btn.click()
    await expect(btn).toBeDisabled({ timeout: 10000 })
  })

  await h.paso('reportar falla', async () => {
    await h.ir('/instructor/reportar-falla')
    await page.getByLabel(/Título del reporte/i).fill(`Falla instructor ${h.sufijo}`)
    await page.getByLabel(/Descripción/i).fill('Reporte creado automáticamente por el agente instructor para validar el flujo de reportes.')
    h.usar('Enviar reporte')
    await page.getByRole('button', { name: /Enviar reporte/i }).click()
    await h.esperar('Gracias por reportar', 10000)
  })
}
