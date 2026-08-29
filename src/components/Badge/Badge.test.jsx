import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it('renderiza los children', () => {
    render(<Badge>En Revisión</Badge>)
    expect(screen.getByText('En Revisión')).toBeInTheDocument()
  })

  it('usa la variante neutral por defecto', () => {
    render(<Badge>Neutral</Badge>)
    expect(screen.getByText('Neutral').className).toContain('neutral')
  })

  it('aplica la variante indicada', () => {
    const { container } = render(<Badge variant="danger">Peligro</Badge>)
    expect(container.querySelector('span').className).toContain('danger')
  })
})
