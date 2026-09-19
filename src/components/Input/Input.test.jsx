import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordInput } from './Input'

describe('PasswordInput', () => {
  it('oculta la contraseña por defecto', () => {
    render(<PasswordInput aria-label="Contraseña" />)

    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
  })

  it('alterna entre visible y oculta con el botón', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Contraseña" />)

    const input = screen.getByLabelText('Contraseña')
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))

    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('reenvía value, onChange, autoComplete y el id inyectado', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <PasswordInput
        id="clave-1"
        aria-label="Contraseña"
        value=""
        onChange={onChange}
        autoComplete="new-password"
      />
    )

    const input = screen.getByLabelText('Contraseña')
    expect(input).toHaveAttribute('id', 'clave-1')
    expect(input).toHaveAttribute('autocomplete', 'new-password')

    await user.type(input, 'a')
    expect(onChange).toHaveBeenCalled()
  })
})
