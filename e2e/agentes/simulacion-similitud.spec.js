// Simulación cruzada "similitud entre dos aprendices": dos propuestas casi
// iguales, aprobadas por el instructor, generan una coincidencia verificable.
import { test, expect } from '../helpers'
import { crearEjecutor, escribirReporte } from './acciones/util'
import { simulacionSimilitud } from './acciones/simulacion-similitud'

test.setTimeout(300000)

test('simulación cruzada: dos aprendices generan una similitud que el instructor y María ven', async ({ page }) => {
  const h = crearEjecutor(page, 'simulacion-similitud')
  await simulacionSimilitud(h)
  escribirReporte('simulacion-similitud', h)

  const detalle = h.problemas.map((p) => `- [${p.tipo}] ${p.url} :: ${p.detalle}`).join('\n')
  expect(h.problemas, `Simulación similitud: ${h.problemas.length} problema(s):\n${detalle}`).toEqual([])
})
