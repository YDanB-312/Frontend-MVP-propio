import { describe, expect, it } from 'vitest'
import { toPct, getSimilitudInfo, getSimilitudMax } from './similitudInfo'

const SIMS = [
  { projectId1: 1, projectId2: 2, similitud: 0.873 },
  { projectId1: 1, projectId2: 3, similitud: 0.42 },
  { projectId1: 2, projectId2: 3, similitud: 0.1 },
]

describe('similitudInfo', () => {
  it('toPct redondea fracciones y tolera inválidos', () => {
    expect(toPct(0.873)).toBe(87)
    expect(toPct(0)).toBe(0)
    expect(toPct(null)).toBe(0)
    expect(toPct('x')).toBe(0)
  })

  it('getSimilitudInfo retorna máximo y conteo', () => {
    expect(getSimilitudInfo(SIMS, 1)).toEqual({ pct: 87, count: 2 })
  })

  it('retorna null sin coincidencias', () => {
    expect(getSimilitudInfo(SIMS, 99)).toBeNull()
    expect(getSimilitudInfo([], 1)).toBeNull()
  })

  it('getSimilitudMax retorna solo el máximo', () => {
    expect(getSimilitudMax(SIMS, 2)).toBe(87)
    expect(getSimilitudMax(SIMS, 99)).toBeNull()
  })
})
