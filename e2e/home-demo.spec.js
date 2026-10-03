import { test, expect } from './helpers'

// La landing es pública: cualquier visitante puede probar el motor sin sesión.
test.describe('Home pública: demo del motor', () => {
  test('sin sesión muestra el resumen y el playground sin 401', async ({ page }) => {
    const noAutorizado = []
    // La sonda de sesión (/auth/me) responde 401 a un visitante: es esperada.
    page.on('response', (r) => {
      if (r.status() === 401 && !r.url().includes('/auth/me')) noAutorizado.push(r.url())
    })

    await page.goto('/')

    // Barra superior con la config real del motor (endpoint público)
    await expect(page.getByText('DETECCIÓN DE SIMILITUD')).toBeVisible({ timeout: 15000 })

    // Chips del hero con conteos reales
    await expect(page.getByText('Propuestas', { exact: true })).toBeVisible()
    await expect(page.getByText('Programas', { exact: true })).toBeVisible()

    // Playground en vivo: escribe una idea y aparece el top-3 con porcentajes
    const input = page.locator('#demo-idea')
    await expect(input).toBeVisible()
    await input.fill('plataforma de inventarios para tienda con control de stock')
    await expect(page.locator('[class*="termMatch"]').first()).toBeVisible({ timeout: 15000 })
    expect(await page.locator('[class*="termMatch"]').count()).toBeGreaterThan(0)

    // Ninguna llamada pública debe responder 401
    expect(noAutorizado).toHaveLength(0)
  })
})
