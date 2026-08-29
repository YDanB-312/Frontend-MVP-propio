import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from './Avatar'

describe('Avatar', () => {
  it('muestra las iniciales cuando no hay imagen', () => {
    render(<Avatar name="María González" />)
    expect(screen.getByText('MG')).toBeInTheDocument()
  })

  it('muestra la inicial única para un nombre simple', () => {
    render(<Avatar name="Carlos" />)
    expect(screen.getByText('CA')).toBeInTheDocument()
  })

  it('muestra una imagen cuando se provee src', () => {
    const { container } = render(<Avatar name="Ana" src="/foto.jpg" />)
    expect(container.querySelector('img')).toHaveAttribute('src', '/foto.jpg')
  })

  it('usa title cuando se provee', () => {
    render(<Avatar name="Ana" title="Perfil de Ana" />)
    expect(screen.getByTitle('Perfil de Ana')).toBeInTheDocument()
  })
})
