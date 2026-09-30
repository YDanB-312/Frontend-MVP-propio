import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GradeBadge from './GradeBadge'
import { gradeForScore } from './grade'

describe('gradeForScore', () => {
  it('mapea fracción y porcentaje igual', () => {
    expect(gradeForScore(0.87)).toEqual({ grade: 'A', pct: 87 })
    expect(gradeForScore(87)).toEqual({ grade: 'A', pct: 87 })
  })

  it('clasifica según el umbral: A >= umbral, B >= umbral/2, C el resto', () => {
    // umbral por defecto: 30
    expect(gradeForScore(95).grade).toBe('A')
    expect(gradeForScore(30).grade).toBe('A')
    expect(gradeForScore(29).grade).toBe('B')
    expect(gradeForScore(15).grade).toBe('B')
    expect(gradeForScore(14).grade).toBe('C')
  })

  it('responde al umbral configurado', () => {
    expect(gradeForScore(70, 75).grade).toBe('B') // 70 < 75 y 70 >= 37.5
    expect(gradeForScore(80, 75).grade).toBe('A') // 80 >= 75
    expect(gradeForScore(30, 75).grade).toBe('C') // 30 < 37.5
  })
})

describe('GradeBadge', () => {
  it('muestra letra y porcentaje con aria-label de nivel', () => {
    render(<GradeBadge score={0.87} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('87%')).toBeInTheDocument()
    expect(screen.getByLabelText('Coincidencia alta: 87%')).toBeInTheDocument()
  })

  it('oculta el porcentaje si showPct es falso', () => {
    render(<GradeBadge score={10} showPct={false} />) // 10 < umbral/2 (15) → C
    expect(screen.queryByText('10%')).not.toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })
})
