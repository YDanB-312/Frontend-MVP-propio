import { test, expect } from '../helpers'
import { crearEjecutor, escribirReporte } from './acciones/util'
import { simulacionReasignacion } from './acciones/simulacion-reasignacion'

test.setTimeout(240000)

test('simulación cruzada: reasignación de un aprendiz entre centros', async ({ page }) => {
  const h = crearEjecutor(page, 'simulacion-reasignacion')
  await simulacionReasignacion(h)
  escribirReporte('simulacion-reasignacion', h)

  const detalle = h.problemas.map((p) => `- [${p.tipo}] ${p.url} :: ${p.detalle}`).join('\n')
  expect(h.problemas, `Simulación reasignación: ${h.problemas.length} problema(s):\n${detalle}`).toEqual([])
})
