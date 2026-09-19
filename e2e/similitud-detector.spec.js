import { test, expect, login, logout } from './helpers'

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
  test('una pendiente no ve a otra pendiente; tras aprobar, la editada sí la detecta', async ({ page }) => {
    // Títulos únicos por corrida: el reseed es por archivo, y un reintento
    // acumularía propuestas duplicadas con el mismo texto.
    const suf = String(Date.now())
    const temaA = { ...TEMA_A, titulo: `${TEMA_A.titulo} ${suf}` }
    const temaB = { ...TEMA_B, titulo: `${TEMA_B.titulo} ${suf}` }

    await login(page, 'aprendiz')
    await page.getByRole('link', { name: 'Propuestas' }).first().click()
    await page.waitForURL('**/aprendiz/propuestas')

    await crearPropuesta(page, temaA)

    await page.goto('/aprendiz/propuestas')
    await crearPropuesta(page, temaB)

    // Regla de negocio: solo las aprobadas entran al corpus, así que dos
    // pendientes del mismo tema NO se comparan entre sí (aunque el seed sí
    // tenga aprobadas parecidas: la que debe faltar es la pendiente).
    await expect(page.getByText(temaA.titulo)).toHaveCount(0)

    // El instructor aprueba la primera propuesta.
    await logout(page)
    await login(page, 'instructor')
    await page.goto('/instructor/revision-propuestas')
    const nodo = page.getByRole('button', { name: temaA.titulo }).first()
    await expect(nodo).toBeVisible({ timeout: 15000 })
    await nodo.click()
    await page.getByRole('button', { name: `Aprobar ${temaA.titulo}` }).click()
    await page.getByRole('button', { name: /Sí, aprobar/i }).click()
    await expect(page.getByRole('button', { name: `Aprobar ${temaA.titulo}` })).toHaveCount(0, { timeout: 10000 })

    // El aprendiz edita y guarda la segunda propuesta: al guardar, el motor
    // vuelve a puntuar y ahora sí encuentra a la aprobada.
    await logout(page)
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/propuestas')
    await page.getByRole('link', { name: temaB.titulo }).first().click()
    await page.waitForURL('**/aprendiz/detalle-proyecto/**')
    await page.getByRole('button', { name: /^Editar$/ }).click()
    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.getByText(/Propuesta actualizada correctamente/i)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(temaA.titulo)).toBeVisible()
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
