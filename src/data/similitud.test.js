import { describe, expect, it } from 'vitest'
import { tokenizar, stemEs, vectorDeProyecto, construirIdf, similitudEntre, similitudProyectos } from './similitud'

const TIENDA_A = {
  title: 'Tienda virtual para comercializar artesanías',
  keywords: 'artesanías, ventas, comercio',
  description: 'Plataforma web que permite a los artesanos vender sus productos en línea con pagos y catálogo.',
  objetivoGeneral: 'Comercializar artesanías por internet',
  objetivosEspecificos: 'Implementar catálogo\nImplementar pagos',
  technologies: '',
  areaAplicacion: 'Desarrollo Web',
  deliverables: '',
}

const TIENDA_B = {
  title: 'Plataforma de comercio electrónico para artesanos',
  keywords: 'ecommerce, ventas online, manualidades',
  description: 'Sistema web para que artesanos ofrezcan manualidades y reciban pedidos con pasarela de pagos.',
  objetivoGeneral: 'Vender manualidades artesanales en línea',
  objetivosEspecificos: 'Diseñar tienda\nIntegrar pagos',
  technologies: '',
  areaAplicacion: 'Desarrollo Web',
  deliverables: '',
}

const RIEGO = {
  title: 'Sistema IoT para riego agrícola',
  keywords: 'iot, sensores, agricultura',
  description: 'Red de sensores de humedad del suelo que automatiza el riego por goteo en cultivos.',
  objetivoGeneral: 'Optimizar el agua de riego',
  objetivosEspecificos: 'Instalar sensores\nAutomatizar válvulas',
  technologies: '',
  areaAplicacion: 'Otro',
  deliverables: '',
}

describe('motor comparativo de similitud', () => {
  it('normaliza plurales y tildes al mismo token', () => {
    expect(tokenizar('ventas')).toEqual(tokenizar('venta'))
    expect(tokenizar('artesanías')).toEqual(tokenizar('artesania'))
  })

  it('expande sinónimos de dominio (ecommerce, tienda, app)', () => {
    expect(tokenizar('ecommerce')).toEqual(expect.arrayContaining(['comercio', 'electronico']))
    expect(tokenizar('tienda')).toEqual(expect.arrayContaining(['comercio']))
    expect(tokenizar('app')).toEqual(expect.arrayContaining(['sistema']))
  })

  it('stemEs es consistente entre formas verbales', () => {
    expect(stemEs('implementando')).toBe(stemEs('implementar'))
    expect(stemEs('tutores')).toBe(stemEs('tutor'))
  })

  it('detecta paráfrasis del mismo tema sobre el umbral (0.2)', () => {
    expect(similitudProyectos(TIENDA_A, TIENDA_B, [RIEGO])).toBeGreaterThanOrEqual(0.2)
  })

  it('no relaciona temas distintos', () => {
    expect(similitudProyectos(TIENDA_A, RIEGO, [TIENDA_B])).toBeLessThan(0.2)
  })

  it('documentos idénticos dan 1 y vacíos dan 0', () => {
    expect(similitudProyectos(TIENDA_A, TIENDA_A, [RIEGO])).toBeCloseTo(1, 5)
    const idf = construirIdf([vectorDeProyecto(TIENDA_A)])
    expect(similitudEntre(vectorDeProyecto(TIENDA_A), vectorDeProyecto(null), idf)).toBe(0)
  })
})
