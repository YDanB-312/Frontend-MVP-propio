import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DataTable from './DataTable'

const COLUMNAS = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'estado', header: 'Estado', render: (r) => <strong>{r.estado}</strong> },
]
const FILAS = [{ id: 1, nombre: 'Ana', estado: 'Activo' }]

describe('DataTable', () => {
  it('muestra vacío cuando no hay filas', () => {
    render(<DataTable columns={COLUMNAS} rows={[]} empty="Nada por aquí." />)
    expect(screen.getByText('Nada por aquí.')).toBeInTheDocument()
  })

  it('renderiza celdas con data-label para modo tarjetas', () => {
    const { container } = render(<DataTable columns={COLUMNAS} rows={FILAS} ariaLabel="Usuarios" />)
    expect(screen.getByRole('table', { name: 'Usuarios' })).toBeInTheDocument()
    const celda = container.querySelector('td[data-label="Estado"]')
    expect(celda?.textContent).toBe('Activo')
  })
})
