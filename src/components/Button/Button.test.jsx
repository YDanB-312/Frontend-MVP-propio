import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('renderiza un <button> por defecto', () => {
    render(<Button>Aceptar</Button>)
    const btn = screen.getByRole('button', { name: 'Aceptar' })
    expect(btn.tagName).toBe('BUTTON')
  })

  it('aplica la variante primaria por defecto', () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByRole('button', { name: 'Guardar' }).className).toContain('primary')
  })

  it('aplica una variante dada', () => {
    render(<Button variant="danger">Eliminar</Button>)
    expect(screen.getByRole('button', { name: 'Eliminar' }).className).toContain('danger')
  })

  it('propaga props al elemento subyacente', () => {
    render(<Button type="submit">Enviar</Button>)
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('type', 'submit')
  })
})
