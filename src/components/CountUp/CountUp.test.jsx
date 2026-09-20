import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CountUp from './CountUp'

describe('CountUp', () => {
  it('expone el valor numérico final de forma accesible', () => {
    render(<CountUp value={12} />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('respeta prefijo y sufijo no numéricos', () => {
    render(<CountUp value="35%" />)
    expect(screen.getByText('35%')).toBeInTheDocument()
  })

  it('renderiza valores no numéricos sin animar', () => {
    render(<CountUp value="—" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
