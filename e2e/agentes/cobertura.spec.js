// Auditoría de cobertura: cada control visible de `main` en cada ruta del rol
// debe quedar clasificado (cubierto por un playbook o justificado). Si algo
// queda "sin cubrir", el test falla y lo lista para cerrarlo.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect, login } from '../helpers'
import { inventariar } from './acciones/util'
import { clasificar } from './cobertura-catalogo'
import { RUTAS_POR_ROL } from '../rutas'

test.setTimeout(600000)

const RUTAS_COBERTURA = {
  ...RUTAS_POR_ROL,
  admin: [
    ...(RUTAS_POR_ROL.admin || []),
    '/admin/bitacora',
    '/admin/reportes-fallas',
    '/admin/detalle-reporte/1',
    '/admin/notificaciones',
    '/admin/proyectos',
    '/admin/detalle-proyecto/4',
    '/admin/similitudes',
    '/admin/detalle-similitud/1',
    '/admin/detalle-usuario/2',
  ],
}

const ROLES = ['aprendiz', 'instructor', 'admin']

for (const rol of ROLES) {
  test(`cobertura ${rol}: todo control clasificado`, async ({ page }) => {
    await login(page, rol)

    const resumen = []
    const sinCubrir = []

    for (const ruta of RUTAS_COBERTURA[rol] || []) {
      await page.goto(ruta, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(600)
      const controles = await inventariar(page)

      let cubiertos = 0
      let justificados = 0
      for (const c of controles) {
        const { estado, motivo } = clasificar(c)
        if (estado === 'cubierto') cubiertos++
        else if (estado === 'justificado') justificados++
        else sinCubrir.push({ ruta, tipo: c.tipo, key: c.key, motivo })
      }
      resumen.push({ ruta, total: controles.length, cubiertos, justificados })
    }

    // Reporte de cobertura.
    const salida = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '..', '..',
      'agentes-reportes', 'cobertura'
    )
    fs.mkdirSync(salida, { recursive: true })
    fs.writeFileSync(
      path.join(salida, `${rol}.json`),
      JSON.stringify({ rol, rutas: RUTAS_COBERTURA[rol], resumen, sinCubrir }, null, 2)
    )

    const detalle = sinCubrir.map((s) => `- ${s.ruta} · [${s.tipo}] ${s.key}`).join('\n')
    expect(
      sinCubrir,
      `Cobertura ${rol}: ${sinCubrir.length} control(es) sin clasificar:\n${detalle}`
    ).toEqual([])
  })
}
