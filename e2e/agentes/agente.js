// Agente de navegación autónoma por rol.
//
// Cada agente hace login con su cuenta y recorre la app por sí solo: parte del
// dashboard y de las rutas conocidas, descubre enlaces del sidebar (BFS con
// tope de páginas y profundidad) y valida cada página. Es de SOLO LECTURA: no
// envía formularios ni ejecuta acciones destructivas, así que varios agentes
// pueden correr en paralelo sin pisarse.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { login } from '../helpers'
import { RUTAS_POR_ROL } from '../rutas'

// Prefijo de las rutas propias de cada rol.
const PREFIJO = {
  aprendiz: '/aprendiz',
  instructor: '/instructor',
  admin: '/admin',
}

const HOME = {
  aprendiz: '/aprendiz/dashboard',
  instructor: '/instructor/dashboard',
  admin: '/admin/dashboard',
}

const MAX_PAGINAS = 25
const MAX_PROFUNDIDAD = 3

// Ruido conocido de la consola que no representa una falla de la app.
const CONSOLA_IGNORADA = [
  /favicon/i,
  /Download the React DevTools/i,
]

function esApi(url) {
  return url.includes('/v1/')
}

// Toggles accesibles (colapsables/menús). Interacción segura y reversible.
async function togglesAccesibles(page) {
  const botones = page.locator('button[aria-expanded]')
  const total = Math.min(await botones.count().catch(() => 0), 2)
  for (let i = 0; i < total; i++) {
    const b = botones.nth(i)
    if (await b.isVisible().catch(() => false)) {
      await b.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(120)
    }
  }
}

export async function recorrer(page, rol) {
  const problemas = []
  const firma = new Set()
  const anotar = (tipo, url, detalle) => {
    const key = `${tipo}|${url}|${detalle}`
    if (firma.has(key)) return
    firma.add(key)
    problemas.push({ tipo, url, detalle: String(detalle).slice(0, 300) })
  }

  let urlActual = ''
  page.on('pageerror', (err) => anotar('pageerror', urlActual, err.message))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const texto = msg.text()
    if (CONSOLA_IGNORADA.some((re) => re.test(texto))) return
    anotar('console', urlActual, texto)
  })
  page.on('response', (res) => {
    if (!esApi(res.url())) return
    const status = res.status()
    if (status >= 400) anotar('http', urlActual, `${status} ${res.request().method()} ${res.url()}`)
  })

  // 1) Login y arranque del recorrido.
  await login(page, rol)
  await page.waitForTimeout(400)

  const prefijo = PREFIJO[rol]
  const cola = []
  const visto = new Set()
  const enCola = new Set()

  const encolar = (href, prof) => {
    if (!href) return
    const limpio = String(href).split('#')[0]
    if (!limpio.startsWith(prefijo)) return
    if (limpio.startsWith('/login')) return
    if (visto.has(limpio) || enCola.has(limpio)) return
    enCola.add(limpio)
    cola.push({ url: limpio, prof })
  }

  encolar(HOME[rol], 0)
  for (const r of RUTAS_POR_ROL[rol] || []) encolar(r, 1)

  let visitadas = 0
  while (cola.length > 0 && visitadas < MAX_PAGINAS) {
    const { url, prof } = cola.shift()
    enCola.delete(url)
    if (visto.has(url)) continue
    visto.add(url)
    visitadas++
    urlActual = url

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
    } catch {
      anotar('navegacion', url, 'la página no cargó')
      continue
    }
    // Margen corto para que la vista pinte y dispare sus consultas.
    await page.waitForTimeout(400)

    // La sesión no debería caerse hacia /login en rutas propias.
    if (new URL(page.url()).pathname.startsWith('/login')) {
      anotar('login-redirect', url, 'redirigió a /login estando autenticado')
      continue
    }

    const texto = await page.locator('body').innerText().catch(() => '')
    if (/Algo salió mal/i.test(texto)) anotar('safe-fallback', url, 'SafeRoute mostró el fallback de error')
    if (/Página no encontrada/i.test(texto)) anotar('not-found', url, 'página 404')
    if (/no autorizad/i.test(texto)) anotar('unauthorized', url, 'vista no autorizada')

    await togglesAccesibles(page).catch(() => {})

    // 2) Descubrir enlaces nuevos del mismo rol.
    if (prof < MAX_PROFUNDIDAD) {
      const hrefs = await page
        .locator('a[href^="/"]')
        .evaluateAll((as) => as.map((a) => a.getAttribute('href')))
        .catch(() => [])
      for (const h of hrefs) encolar(h, prof + 1)
    }
  }

  // 3) Reporte por rol.
  const salida = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'test-results', 'agentes')
  fs.mkdirSync(salida, { recursive: true })
  fs.writeFileSync(
    path.join(salida, `${rol}.json`),
    JSON.stringify({ rol, visitadas, problemas }, null, 2)
  )

  return { visitadas, problemas }
}
