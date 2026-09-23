import { test, expect, login } from './helpers'
import AxeBuilder from '@axe-core/playwright'
import { RUTAS_POR_ROL, RUTAS_PUBLICAS } from './rutas'

const SEVERIDAD_BLOQ = ['critical', 'serious']

for (const [role, rutas] of Object.entries(RUTAS_POR_ROL)) {
  test.describe(`Accesibilidad: ${role}`, () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    for (const ruta of rutas) {
      test(`${role} → ${ruta} sin violaciones críticas/serias`, async ({ page }) => {
        await login(page, role)
        await page.goto(ruta)
        await page.waitForLoadState('networkidle')

        const resultados = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()

        const bloqueantes = resultados.violations.filter((v) =>
          v.nodes.some((n) => SEVERIDAD_BLOQ.includes(n.impact))
        )

        expect(
          bloqueantes,
          bloqueantes.length
            ? `Violaciones ${role} en ${ruta}: ${bloqueantes
                .map((v) => `${v.id} (${v.help})`)
                .join(' | ')}`
            : 'OK'
        ).toEqual([])
      })
    }

    test(`${role} → los elementos interactivos muestran indicador de foco visible`, async ({ page }) => {
      await login(page, role)
      await page.goto(`/${role}/dashboard`)

      await page.locator('a[href], button').first().waitFor({ state: 'visible' })
      await page.waitForTimeout(300)

      let conIndicador = 0
      let inspeccionados = 0
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(60)
        const info = await page.evaluate(() => {
          const el = document.activeElement
          if (!el || el === document.body) return null
          const estilo = getComputedStyle(el)
          const tieneOutline = estilo.outlineWidth !== '0px' && estilo.outlineStyle !== 'none'
          const tieneShadow = estilo.boxShadow && estilo.boxShadow !== 'none'
          return { indicador: tieneOutline || tieneShadow }
        })
        if (!info) continue
        inspeccionados += 1
        if (info.indicador) conIndicador += 1
      }

      expect(inspeccionados, `no se encontraron elementos enfocables en el dashboard de ${role}`).toBeGreaterThan(0)
      expect(conIndicador, `de ${inspeccionados} elementos enfocados en ${role}, ninguno mostró indicador de foco visible`).toBeGreaterThan(0)
    })
  })
}

test.describe('Accesibilidad: páginas públicas', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  for (const ruta of RUTAS_PUBLICAS) {
    test(`pública → ${ruta} sin violaciones críticas/serias`, async ({ page }) => {
      await page.goto(ruta)
      await page.waitForLoadState('networkidle')

      const resultados = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const bloqueantes = resultados.violations.filter((v) =>
        v.nodes.some((n) => SEVERIDAD_BLOQ.includes(n.impact))
      )

      expect(
        bloqueantes,
        bloqueantes.length
          ? `Violaciones públicas en ${ruta}: ${bloqueantes.map((v) => `${v.id} (${v.help})`).join(' | ')}`
          : 'OK'
      ).toEqual([])
    })
  }
})
