import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFocusTrap } from './useFocusTrap'

function Dialogo({ onEscape }) {
  const ref = useFocusTrap({ active: true, onEscape })
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Diálogo">
      <button type="button">Primero</button>
      <button type="button">Segundo</button>
    </div>
  )
}

describe('useFocusTrap', () => {
  it('enfoca el primer elemento y cicla Tab/Shift+Tab', async () => {
    render(<Dialogo />)
    const primero = screen.getByRole('button', { name: 'Primero' })
    const segundo = screen.getByRole('button', { name: 'Segundo' })
    await screen.findByRole('dialog')
    expect(primero).toHaveFocus()
    await userEvent.keyboard('{Tab}')
    expect(segundo).toHaveFocus()
    await userEvent.keyboard('{Tab}')
    expect(primero).toHaveFocus()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(segundo).toHaveFocus()
  })

  it('llama onEscape con Escape', async () => {
    const onEscape = vi.fn()
    render(<Dialogo onEscape={onEscape} />)
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    expect(onEscape).toHaveBeenCalled()
  })
})
