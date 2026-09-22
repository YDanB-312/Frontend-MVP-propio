// Ejecutor de acciones para los agentes de rol.
//
// Envuelve cada acción en un "paso" verificable, registra problemas (errores de
// página/consola, HTTP ≥ 400, pasos fallidos) y deja un reporte JSON por rol.
// Es determinista: cada agente usa datos con sufijo único y opera sobre el seed
// de forma controlada; el runner restaura el seed al terminar.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function crearEjecutor(page, rol) {
  const sufijo = String(Date.now()).slice(-6)
  const pasos = []
  const problemas = []
  const cobertura = {}
  const firma = new Set()
  let urlActual = ''
  let coberturaCapturada = false

  const anotar = (tipo, url, detalle) => {
    const key = `${tipo}|${url}|${detalle}`
    if (firma.has(key)) return
    firma.add(key)
    problemas.push({ tipo, url, detalle: String(detalle).slice(0, 300) })
  }

  page.on('pageerror', (err) => anotar('pageerror', urlActual, err.message))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const texto = msg.text()
    if (/favicon|React DevTools/i.test(texto)) return
    anotar('console', urlActual, texto)
  })
  page.on('response', (res) => {
    if (res.url().includes('/v1/') && res.status() >= 400) {
      anotar('http', urlActual, `${res.status()} ${res.request().method()} ${res.url()}`)
    }
  })

  const h = {
    page,
    rol,
    sufijo,
    pasos,
    problemas,
    cobertura,
    anotar,
    urlActual: () => urlActual,

    // Marca un control como ejercitado (auditoría de cobertura).
    usar(label) {
      if (!cobertura[urlActual]) cobertura[urlActual] = { tocados: [], vistos: [] }
      cobertura[urlActual].tocados.push(String(label))
    },

    async ir(url) {
      urlActual = url
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(400)
    },

    esperar(texto, timeout = 10000) {
      return page.getByText(texto).first().waitFor({ state: 'visible', timeout })
    },

    // Ejecuta una acción y captura el JSON de la respuesta de la API.
    async capturar(metodo, urlParte, accion) {
      const [resp] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes(urlParte) && r.request().method() === metodo,
          { timeout: 20000 }
        ),
        accion(),
      ])
      return resp.json().catch(() => null)
    },

    // Envuelve un paso: no aborta el playbook, pero registra el fallo.
    async paso(nombre, fn) {
      try {
        await fn()
        pasos.push({ paso: nombre, ok: true })
      } catch (err) {
        const msg = String(err?.message || err).replace(/\s+/g, ' ').slice(0, 260)
        pasos.push({ paso: nombre, ok: false, error: msg })
        anotar('paso', urlActual, `${nombre}: ${msg}`)
      }
    },

    // Registra los controles visibles de la página actual (una sola vez).
    async auditar(soloUna = true) {
      if (soloUna && coberturaCapturada) return
      coberturaCapturada = soloUna
      const vistos = await page
        .locator('main button, main a[href], main select, main input')
        .evaluateAll((els) =>
          els
            .map((e) =>
              (e.getAttribute('aria-label') || e.textContent || e.getAttribute('name') || e.getAttribute('placeholder') || '')
                .trim()
                .slice(0, 55)
            )
            .filter(Boolean)
        )
        .catch(() => [])
      if (!cobertura[urlActual]) cobertura[urlActual] = { tocados: [], vistos: [] }
      cobertura[urlActual].vistos = Array.from(new Set(vistos)).slice(0, 80)
    },
  }

  return h
}

// Inventario estable de controles interactivos de la vista actual.
// Devuelve [{ tipo, key, deshabilitado }] deduplicado por tipo+key.
export async function inventariar(page) {
  const items = await page
    .locator('main a[href], main button, main select, main input:not([type="hidden"]), main textarea')
    .evaluateAll((els) =>
      els.map((e) => {
        const tag = e.tagName.toLowerCase()
        const tipo = tag === 'a' ? 'link' : tag
        const key = (
          e.getAttribute('aria-label') ||
          e.textContent ||
          e.getAttribute('name') ||
          e.getAttribute('placeholder') ||
          ''
        )
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 60)
        return { tipo, key, deshabilitado: e.disabled === true || e.getAttribute('aria-disabled') === 'true' }
      })
    )
    .catch(() => [])

  const vistos = new Set()
  const out = []
  for (const it of items) {
    if (!it.key) continue
    const k = `${it.tipo}|${it.key}`
    if (vistos.has(k)) continue
    vistos.add(k)
    out.push(it)
  }
  return out
}

export function escribirReporte(rol, h) {
  // Fuera de test-results: Playwright borra ese directorio en cada invocación.
  const salida = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..', '..', '..',
    'agentes-reportes', 'acciones'
  )
  fs.mkdirSync(salida, { recursive: true })
  fs.writeFileSync(
    path.join(salida, `${rol}.json`),
    JSON.stringify(
      { rol, sufijo: h.sufijo, pasos: h.pasos, problemas: h.problemas, cobertura: h.cobertura },
      null,
      2
    )
  )
}
