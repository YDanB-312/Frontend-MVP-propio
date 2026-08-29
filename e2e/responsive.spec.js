import { test, expect, login } from './helpers'
import { RUTAS_POR_ROL, RUTAS_PUBLICAS } from './rutas'

const VIEWPORTS = [
  { name: 'móvil 375', width: 375, height: 812 },
  { name: 'tablet 768', width: 768, height: 1024 },
]

for (const [role, rutas] of Object.entries(RUTAS_POR_ROL)) {
  test.describe(`Responsive: ${role}`, () => {
    for (const vp of VIEWPORTS) {
      test.describe(vp.name, () => {
        test.use({ viewport: { width: vp.width, height: vp.height } })

        for (const ruta of rutas) {
          test(`${vp.name} → ${ruta} sin desbordamiento horizontal ni errores`, async ({ page }) => {
            const problemas = []
            page.on('pageerror', (err) => problemas.push('pageerror: ' + err.message))

            await login(page, role)
            await page.goto(ruta)
            await page.waitForTimeout(600)

            const { scrollWidth, clientWidth } = await page.evaluate(() => ({
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
            }))

            if (scrollWidth > clientWidth + 1) {
              problemas.push(`scroll horizontal: ${scrollWidth}px > ${clientWidth}px`)
            }

            expect(problemas, problemas.length ? `Problemas en ${ruta}@${vp.width}px: ${problemas.join(' | ')}` : 'OK').toEqual([])
          })
        }
      })
    }
  })
}

test.describe('Responsive: públicas', () => {
  for (const vp of VIEWPORTS) {
    test.describe(vp.name, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } })

      for (const ruta of RUTAS_PUBLICAS) {
        test(`${vp.name} → ${ruta} sin desbordamiento horizontal ni errores`, async ({ page }) => {
          const problemas = []
          page.on('pageerror', (err) => problemas.push('pageerror: ' + err.message))

          await page.goto(ruta)
          await page.waitForTimeout(600)

          const { scrollWidth, clientWidth } = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }))

          if (scrollWidth > clientWidth + 1) {
            problemas.push(`scroll horizontal: ${scrollWidth}px > ${clientWidth}px`)
          }

          expect(problemas, problemas.length ? `Problemas en ${ruta}@${vp.width}px: ${problemas.join(' | ')}` : 'OK').toEqual([])
        })
      }
    })
  }
})
