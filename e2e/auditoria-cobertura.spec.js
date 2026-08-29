import { test, expect, login } from './helpers'
import { RUTAS_POR_ROL } from './rutas'

for (const [role, rutas] of Object.entries(RUTAS_POR_ROL)) {
  test.describe(`Cobertura: ${role}`, () => {
    for (const ruta of rutas) {
      test(`${role} → ${ruta}`, async ({ page }) => {
        const problemas = []
        page.on('pageerror', (err) => problemas.push('pageerror: ' + err.message))
        page.on('console', (msg) => {
          if (msg.type() === 'error') problemas.push('console: ' + msg.text().slice(0, 180))
        })

        await login(page, role)
        await page.goto(ruta)
        await page.waitForTimeout(1200)

        // Sin fallback de error
        const fallback = await page.getByText(/Algo salió mal/i).count()
        if (fallback > 0) problemas.push('SafeRoute fallback visible')

        // Shell presente (sidebar o navegación principal)
        const shell = page.locator('nav, [class*="sidebar"], [class*="complementary"]').first()
        await expect(shell).toBeVisible()

        expect(problemas, problemas.length ? `Problemas en ${ruta}: ${problemas.join(' | ')}` : 'OK').toEqual([])
      })
    }
  })
}
