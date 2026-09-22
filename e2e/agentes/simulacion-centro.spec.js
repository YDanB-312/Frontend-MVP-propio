// Simulación cruzada "administrador de centro": el superadmin prepara un centro
// con instructor, ficha y coordinador; el coordinador gestiona solo su centro.
import { test, expect } from '../helpers'
import { crearEjecutor, escribirReporte } from './acciones/util'
import { simulacionCentro } from './acciones/simulacion-centro'

test.setTimeout(300000)

test('simulación cruzada: superadmin prepara el centro y el coordinador lo gestiona', async ({ page }) => {
  const h = crearEjecutor(page, 'simulacion-centro')
  await simulacionCentro(h)
  escribirReporte('simulacion-centro', h)

  const detalle = h.problemas.map((p) => `- [${p.tipo}] ${p.url} :: ${p.detalle}`).join('\n')
  expect(h.problemas, `Simulación centro: ${h.problemas.length} problema(s):\n${detalle}`).toEqual([])
})
