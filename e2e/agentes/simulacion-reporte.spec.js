import { test, expect } from '../helpers'
import { crearEjecutor, escribirReporte } from './acciones/util'
import { simulacionReporte } from './acciones/simulacion-reporte'

test.setTimeout(240000)

test('simulación cruzada: reporte de falla → coordinador → notificación', async ({ page }) => {
  const h = crearEjecutor(page, 'simulacion-reporte')
  await simulacionReporte(h)
  escribirReporte('simulacion-reporte', h)

  const detalle = h.problemas.map((p) => `- [${p.tipo}] ${p.url} :: ${p.detalle}`).join('\n')
  expect(h.problemas, `Simulación reporte: ${h.problemas.length} problema(s):\n${detalle}`).toEqual([])
})
