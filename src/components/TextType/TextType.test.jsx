import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, screen } from '@testing-library/react'
import TextType from './TextType'

describe('TextType', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('escribe el texto progresivamente de izquierda a derecha', () => {
    const { container } = render(<TextType text="hola" speed={10} startDelay={0} />)
    const visual = container.querySelector('[aria-hidden="true"]')

    expect(visual.textContent).toBe('')
    act(() => vi.advanceTimersByTime(10))
    expect(visual.textContent).toBe('h')
    act(() => vi.advanceTimersByTime(30))
    expect(visual.textContent).toBe('hola')
  })

  it('expone el texto completo para lectores de pantalla', () => {
    render(<TextType text="comparar" />)
    expect(screen.getByText('comparar')).toBeInTheDocument()
  })

  it('en modo bucle escribe, borra y pasa a la siguiente frase', () => {
    const { container } = render(
      <TextType texts={['ab', 'cd']} speed={10} deleteSpeed={10} hold={10} startDelay={0} />,
    )
    const visual = container.querySelector('[aria-hidden="true"]')
    const paso = () => act(() => vi.advanceTimersByTime(10))

    paso(); expect(visual.textContent).toBe('a')   // t=10
    paso(); expect(visual.textContent).toBe('ab')  // t=20
    paso(); expect(visual.textContent).toBe('ab')  // t=30 (espera)
    paso(); expect(visual.textContent).toBe('a')   // t=40 (borra)
    paso(); expect(visual.textContent).toBe('')    // t=50
    paso(); expect(visual.textContent).toBe('')    // t=60 (cambia)
    paso(); expect(visual.textContent).toBe('c')   // t=70
    paso(); expect(visual.textContent).toBe('cd')  // t=80
  })
})
