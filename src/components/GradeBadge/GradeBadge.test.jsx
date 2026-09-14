import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GradeBadge from './GradeBadge'
import { gradeForScore } from './grade'

describe('gradeForScore', () => {
  it('mapea fracción y porcentaje igual', () => {
    expect(gradeForScore(0.87)).toEqual({ grade: 'A', pct: 87 })
    expect(gradeForScore(87)).toEqual({ grade: 'A', pct: 87 })
  })

  it('S solo desde 90, A desde 70, B desde 40, C el resto', () => {
    expect(gradeForScore(95).grade).toBe('S')
    expect(gradeForScore(70).grade).toBe('A')
    expect(gradeForScore(69).grade).toBe('B')
    expect(gradeForScore(40).grade).toBe('B')
    expect(gradeForScore(39).grade).toBe('C')
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
    render(<GradeBadge score={30} showPct={false} />)
    expect(screen.queryByText('30%')).not.toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })
})
