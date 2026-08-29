import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormField from './FormField'

describe('FormField', () => {
  it('asocia el label con el control mediante htmlFor e id', () => {
    render(
      <FormField label="Correo">
        <input type="email" />
      </FormField>
    )
    const label = screen.getByLabelText('Correo')
    expect(label.tagName).toBe('INPUT')
  })

  it('muestra el mensaje de error y el rol alert', () => {
    render(
      <FormField label="Nombre" error="Campo requerido">
        <input />
      </FormField>
    )
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Campo requerido')
  })

  it('muestra la ayuda cuando no hay error', () => {
    render(
      <FormField label="Nombre" help="Solo letras">
        <input />
      </FormField>
    )
    expect(screen.getByText('Solo letras')).toBeInTheDocument()
  })

  it('marca el campo como requerido', () => {
    render(
      <FormField label="Nombre" required>
        <input />
      </FormField>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })
})
