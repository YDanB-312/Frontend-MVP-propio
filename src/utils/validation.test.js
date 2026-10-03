import { describe, expect, it } from 'vitest'
import { EMAIL_REGEX, MIN_PASSWORD_LENGTH, esEmailValido, esPasswordValida } from './validation'

describe('validation', () => {
  it('expone la misma regex histórica y mínimo 6', () => {
    expect(EMAIL_REGEX).toEqual(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    expect(MIN_PASSWORD_LENGTH).toBe(6)
  })

  it('esEmailValido recorta y valida', () => {
    expect(esEmailValido('a@b.co')).toBe(true)
    expect(esEmailValido('  a@b.co  ')).toBe(true)
    expect(esEmailValido('no-es-correo')).toBe(false)
    expect(esEmailValido('')).toBe(false)
    expect(esEmailValido(null)).toBe(false)
  })

  it('esPasswordValida exige mínimo sin obligar presencia', () => {
    expect(esPasswordValida('123456')).toBe(true)
    expect(esPasswordValida('12345')).toBe(false)
    expect(esPasswordValida('')).toBe(false)
    expect(esPasswordValida(null)).toBe(false)
  })
})
