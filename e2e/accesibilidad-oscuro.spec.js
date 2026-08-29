import { test, expect, login } from './helpers'
import AxeBuilder from '@axe-core/playwright'
import { RUTAS_PUBLICAS } from './rutas'

const RUTAS_OSCURO = {
  aprendiz: ['/aprendiz/dashboard', '/aprendiz/propuestas', '/aprendiz/similitudes', '/aprendiz/detalle-proyecto/4', '/aprendiz/detalle-similitud/1', '/aprendiz/perfil'],
  instructor: ['/instructor/dashboard', '/instructor/revision-propuestas', '/instructor/fichas', '/instructor/detalle-proyecto/4', '/instructor/perfil'],
  admin: ['/admin/dashboard', '/admin/usuarios', '/admin/proyectos', '/admin/similitudes', '/admin/perfil'],
}

const SEVERIDAD_BLOQ = ['critical', 'serious']

async function activarOscuro(page) {
  await page.addInitScript(() => {
    try { localStorage.setItem('theme', 'dark') } catch { /* el navegador de test siempre permite localStorage */ }
  })
}

for (const [role, rutas] of Object.entries(RUTAS_OSCURO)) {
  test.describe(`Accesibilidad modo oscuro: ${role}`, () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test.beforeEach(async ({ page }) => {
      await activarOscuro(page)
    })

    for (const ruta of rutas) {
      test(`${role} → ${ruta} sin violaciones críticas/serias (dark)`, async ({ page }) => {
        await login(page, role)
        await page.goto(ruta)
        await page.waitForLoadState('networkidle')
        await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
        await page.waitForTimeout(200)

        const resultados = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()

        const bloqueantes = resultados.violations.filter((v) =>
          v.nodes.some((n) => SEVERIDAD_BLOQ.includes(n.impact))
        )

        expect(
          bloqueantes,
          bloqueantes.length
            ? `Violaciones dark ${role} en ${ruta}: ${bloqueantes.map((v) => `${v.id} (${v.help})`).join(' | ')}`
            : 'OK'
        ).toEqual([])
      })
    }
  })
}

test.describe('Accesibilidad modo oscuro: públicas', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await activarOscuro(page)
  })

  for (const ruta of RUTAS_PUBLICAS) {
    test(`pública → ${ruta} sin violaciones críticas/serias (dark)`, async ({ page }) => {
      await page.goto(ruta)
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
      await page.waitForTimeout(200)

      const resultados = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const bloqueantes = resultados.violations.filter((v) =>
        v.nodes.some((n) => SEVERIDAD_BLOQ.includes(n.impact))
      )

      expect(
        bloqueantes,
        bloqueantes.length
          ? `Violaciones dark públicas en ${ruta}: ${bloqueantes.map((v) => `${v.id} (${v.help})`).join(' | ')}`
          : 'OK'
      ).toEqual([])
    })
  }
})
