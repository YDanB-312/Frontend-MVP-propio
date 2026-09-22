import { test, expect } from '../helpers'
import { crearEjecutor, escribirReporte } from './acciones/util'
import { simulacionMotor } from './acciones/simulacion-motor'

test.setTimeout(240000)

test('simulación cruzada: el motor es por centro y no contamina a los demás', async ({ page }) => {
  const h = crearEjecutor(page, 'simulacion-motor')
  await simulacionMotor(h)
  escribirReporte('simulacion-motor', h)

  const detalle = h.problemas.map((p) => `- [${p.tipo}] ${p.url} :: ${p.detalle}`).join('\n')
  expect(h.problemas, `Simulación motor: ${h.problemas.length} problema(s):\n${detalle}`).toEqual([])
})
