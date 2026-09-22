// Simulación cruzada multi-rol (un escenario, los 4 roles en cadena):
// el superadmin crea centro + instructor + ficha; el instructor ve su ficha;
// un aprendiz se une por código y propone; el instructor aprueba; el aprendiz
// comprueba la aprobación.
import { test, expect } from '../helpers'
import { crearEjecutor, escribirReporte } from './acciones/util'
import { simulacion } from './acciones/simulacion'

test.setTimeout(300000)

test('simulación cruzada: superadmin → instructor → aprendiz → instructor → aprendiz', async ({ page }) => {
  const h = crearEjecutor(page, 'simulacion-cruzada')
  await simulacion(h)
  escribirReporte('simulacion-cruzada', h)

  const detalle = h.problemas.map((p) => `- [${p.tipo}] ${p.url} :: ${p.detalle}`).join('\n')
  expect(h.problemas, `Simulación: ${h.problemas.length} problema(s):\n${detalle}`).toEqual([])
})
