import { test, expect, login } from './helpers'

const TEMA_A = {
  titulo: 'Tienda virtual de artesanías E2E',
  descripcion:
    'Plataforma web que permite a los artesanos vender sus productos en línea con catálogo, pagos y pedidos para llegar a más clientes.',
  objetivo: 'Comercializar artesanías de la región por internet.',
  especificos: 'Implementar el catálogo de productos artesanales.\nImplementar la pasarela de pagos en línea.',
  keywords: 'artesanías, ventas, comercio',
}

const TEMA_B = {
  titulo: 'Plataforma de comercio electrónico para artesanos E2E',
  descripcion:
    'Sistema web para que los artesanos ofrezcan sus manualidades por internet, reciban pedidos y cobren con pasarela de pagos.',
  objetivo: 'Vender manualidades artesanales en línea.',
  especificos: 'Diseñar la tienda virtual del artesano.\nIntegrar los pagos electrónicos del sistema.',
  keywords: 'ecommerce, ventas online, manualidades',
}

async function crearPropuesta(page, tema) {
  await page.getByRole('main').getByRole('button', { name: /Nueva propuesta/i }).click()
  await page.getByPlaceholder(/Sistema de monitoreo ambiental/i).fill(tema.titulo)
  await page.locator('textarea').nth(0).fill(tema.descripcion)
  await page.locator('textarea').nth(1).fill(tema.objetivo)
  await page.locator('textarea').nth(2).fill(tema.especificos)
  await page.locator('select').nth(0).selectOption({ index: 1 })
  await page.getByPlaceholder(/iot, sensores, agricultura/i).fill(tema.keywords)
  await page.getByRole('button', { name: /Enviar propuesta/i }).click()
  await page.waitForURL('**/aprendiz/analizando-proyecto', { timeout: 15000 })
  await page.waitForURL('**/aprendiz/resultado-analisis**', { timeout: 20000 })
}

test.describe('Detector de similitud entre propuestas', () => {
  test('dos propuestas pendientes del mismo tema generan coincidencia', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.getByRole('link', { name: 'Propuestas' }).first().click()
    await page.waitForURL('**/aprendiz/propuestas')

    await crearPropuesta(page, TEMA_A)

    await page.goto('/aprendiz/propuestas')
    await crearPropuesta(page, TEMA_B)

    // La segunda propuesta sí ve a la primera (pendiente vs pendiente)
    await expect(page.getByRole('heading', { name: /Proyectos con similitud/i })).toBeVisible()
    await expect(page.getByText(TEMA_A.titulo)).toBeVisible()
  })

  test('el ranking agrupa por propuesta y colapsa', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.getByRole('link', { name: 'Similitudes' }).first().click()
    await page.waitForURL('**/aprendiz/similitudes')

    const grupo = page.getByRole('button', { name: /coincidencia/i }).first()
    await expect(grupo).toHaveAttribute('aria-expanded', 'false')
    await expect(grupo).toContainText(/coincidencia/)

    await grupo.click()
    await expect(grupo).toHaveAttribute('aria-expanded', 'true')
    await grupo.click()
    await expect(grupo).toHaveAttribute('aria-expanded', 'false')
  })
})
