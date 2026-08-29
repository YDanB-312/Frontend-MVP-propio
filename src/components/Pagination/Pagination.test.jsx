import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pagination from './Pagination'

describe('Pagination', () => {
  it('no renderiza nada con cero elementos', () => {
    const { container } = render(<Pagination totalItems={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra la información de rango y total', () => {
    render(<Pagination totalItems={25} itemsPerPage={10} paginaActual={1} itemName="proyectos" />)
    expect(screen.getByText(/Mostrando/)).toBeInTheDocument()
  })

  it('permite navegar con el botón siguiente', async () => {
    const setPaginaActual = vi.fn()
    const user = userEvent.setup()
    render(<Pagination totalItems={40} itemsPerPage={10} paginaActual={1} setPaginaActual={setPaginaActual} />)
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(setPaginaActual).toHaveBeenCalledWith(2)
  })

  it('deshabilita el botón anterior en la primera página', () => {
    render(<Pagination totalItems={40} paginaActual={1} />)
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled()
  })
})
