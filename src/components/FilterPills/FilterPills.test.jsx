import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterPills from './FilterPills'

const OPCIONES = [
  { value: 'todos', label: 'Todos', count: 8 },
  { value: 'pendiente', label: 'Pendientes', count: 3 },
]

describe('FilterPills', () => {
  it('marca la opción activa como checked', () => {
    render(<FilterPills options={OPCIONES} value="pendiente" onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: /Pendientes/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /Todos/ })).toHaveAttribute('aria-checked', 'false')
  })

  it('llama onChange con el valor elegido', async () => {
    const onChange = vi.fn()
    render(<FilterPills options={OPCIONES} value="todos" onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: /Pendientes/ }))
    expect(onChange).toHaveBeenCalledWith('pendiente')
  })

  it('las flechas mueven el foco y seleccionan (roving tabindex)', async () => {
    const onChange = vi.fn()
    render(<FilterPills options={OPCIONES} value="todos" onChange={onChange} />)
    const primera = screen.getByRole('radio', { name: /Todos/ })
    primera.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('pendiente')
    expect(screen.getByRole('radio', { name: /Pendientes/ })).toHaveFocus()
  })
})
