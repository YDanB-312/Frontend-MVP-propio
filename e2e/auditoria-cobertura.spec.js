import { test, expect, login } from './helpers'

const RUTAS_POR_ROL = {
  aprendiz: [
    '/aprendiz/dashboard',
    '/aprendiz/propuestas',
    '/aprendiz/ficha',
    '/aprendiz/similitudes',
    '/aprendiz/alertas',
    '/aprendiz/reportar-falla',
    '/aprendiz/perfil',
    '/aprendiz/detalle-proyecto/4',
    '/aprendiz/detalle-proyecto/1',
    '/aprendiz/detalle-ficha/1',
    '/aprendiz/detalle-similitud/1',
    '/aprendiz/perfil-companero/5',
  ],
  instructor: [
    '/instructor/dashboard',
    '/instructor/revision-propuestas',
    '/instructor/similitudes',
    '/instructor/fichas',
    '/instructor/detalle-ficha/1',
    '/instructor/directorio-ficha/1',
    '/instructor/detalle-proyecto/4',
    '/instructor/alertas',
    '/instructor/reportar-falla',
    '/instructor/perfil',
  ],
  admin: [
    '/admin/dashboard',
    '/admin/usuarios',
    '/admin/proyectos',
    '/admin/similitudes',
    '/admin/reportes-fallas',
    '/admin/notificaciones',
    '/admin/perfil',
  ],
}

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
