import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScoreDial from './ScoreDial'

describe('ScoreDial', () => {
  it('expone rol img con etiqueta de grado y porcentaje', () => {
    render(<ScoreDial value={87} />)
    expect(screen.getByRole('img', { name: 'Coincidencia: 87% (grado A)' })).toBeInTheDocument()
  })

  it('normaliza fracciones 0-1 y recorta a 100', () => {
    render(<ScoreDial value={0.64} />)
    expect(screen.getByRole('img', { name: /64%/ })).toBeInTheDocument()
  })
})
