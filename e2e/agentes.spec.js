// 4 agentes (uno por rol) que navegan la app por sí solos y reportan fallos.
//
// Se ejecutan en paralelo con:  npm run test:agentes   (--workers=4)
// Cada agente es de solo lectura, así que no necesitan reseed entre ellos.
import { test, expect } from './helpers'
import { recorrer } from './agentes/agente'

// Permite que los 4 agentes corran a la vez (cuando se pasan --workers>=4).
test.describe.configure({ mode: 'parallel' })
// El recorrido es largo: navega y valida decenas de páginas por agente.
test.setTimeout(240000)

const ROLES = ['aprendiz', 'instructor', 'admin']

for (const rol of ROLES) {
  test(`agente ${rol}: navega por sí solo sin errores`, async ({ page }) => {
    const { visitadas, problemas } = await recorrer(page, rol)

    const detalle = problemas.map((p) => `- [${p.tipo}] ${p.url} :: ${p.detalle}`).join('\n')
    expect(
      problemas,
      `El agente ${rol} visitó ${visitadas} páginas y encontró ${problemas.length} problema(s):\n${detalle}`
    ).toEqual([])
  })
}
