// Simulación cruzada "similitud entre dos aprendices":
//   María y Ana (misma ficha y programa) registran propuestas casi
//   idénticas; el instructor aprueba ambas y el motor detecta la coincidencia;
//   María la ve en su sección de similitudes.
import { expect } from '@playwright/test'
import { entrar, logout } from '../../helpers'

async function crearPropuesta(page, h, titulo) {
  await h.ir('/aprendiz/propuestas')
  await page.getByRole('main').getByRole('button', { name: /Nueva propuesta/i }).click()
  await page.getByPlaceholder(/Sistema de monitoreo ambiental/i).fill(titulo)
  await page.locator('textarea').nth(0).fill('Herramienta web para controlar inventarios de almacén con alertas de stock y reportes de trazabilidad para pequeños comercios.')
  await page.locator('textarea').nth(1).fill('Controlar los inventarios del almacén con alertas por stock mínimo.')
  await page.locator('textarea').nth(2).fill('Registrar entradas y salidas de productos.\nGenerar reportes de trazabilidad por lote.')
  await page.locator('select').nth(0).selectOption({ index: 1 })
  await page.getByRole('button', { name: /Enviar propuesta/i }).click()
  await page.waitForURL('**/aprendiz/analizando-proyecto', { timeout: 15000 })
  await page.waitForURL('**/aprendiz/resultado-analisis**', { timeout: 20000 })
}

async function aprobar(page, h, titulo) {
  await h.ir('/instructor/revision-propuestas')
  const nodo = page
    .getByRole('list', { name: /Cola de revisión/i })
    .getByRole('button', { name: new RegExp(titulo) })
  await nodo.waitFor({ timeout: 15000 })
  await nodo.click()
  await page.getByRole('button', { name: /^Aprobar /i }).click()
  await page.getByRole('button', { name: /Sí, aprobar/i }).click()
  await page.getByRole('button', { name: /^Aprobar /i }).waitFor({ state: 'detached', timeout: 10000 })
}

export async function simulacionSimilitud(h) {
  const { page } = h
  const tituloMaria = `Inventarios María ${h.sufijo}`
  const tituloAna = `Inventarios Ana ${h.sufijo}`

  await h.paso('aprendiz María: registrar propuesta', async () => {
    await entrar(page, 'maria.gonzalez@soy.sena.edu.co', '123456', '/aprendiz/dashboard')
    await crearPropuesta(page, h, tituloMaria)
  })

  await h.paso('aprendiz Ana: registrar propuesta similar', async () => {
    await logout(page)
    await entrar(page, 'ana.martinez@soy.sena.edu.co', '123456', '/aprendiz/dashboard')
    await crearPropuesta(page, h, tituloAna)
  })

  await h.paso('instructor: aprobar ambas y detectar la coincidencia', async () => {
    await logout(page)
    await entrar(page, 'carlos.ruiz@sena.edu.co', '123456', '/instructor/dashboard')
    await aprobar(page, h, tituloMaria)
    await aprobar(page, h, tituloAna)
    // Al aprobar la segunda, el motor reporta las coincidencias detectadas.
    await expect(page.getByText(/se detectaron \d+ coincidencia/i)).toBeVisible({ timeout: 15000 })
  })

  await h.paso('instructor: ver la coincidencia en similitudes', async () => {
    await h.ir('/instructor/similitudes')
    await page.locator('table tbody tr').first().waitFor({ timeout: 10000 })
  })

  await h.paso('aprendiz María: ver su coincidencia con Ana', async () => {
    await logout(page)
    await entrar(page, 'maria.gonzalez@soy.sena.edu.co', '123456', '/aprendiz/dashboard')
    await h.ir('/aprendiz/similitudes')

    const grupo = page
      .getByRole('button', { name: /coincidencia/i })
      .filter({ hasText: tituloMaria })
      .first()
    await grupo.waitFor({ timeout: 15000 })
    await grupo.click()
    const regionId = await grupo.getAttribute('aria-controls')
    await expect(page.locator(`#${regionId}`)).toContainText(tituloAna)
  })
}
