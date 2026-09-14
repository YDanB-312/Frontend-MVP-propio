import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConsoleCard from '../ConsoleCard/ConsoleCard'
import StatChip from '../StatChip/StatChip'
import SectionHeader from '../SectionHeader/SectionHeader'

describe('kit consola', () => {
  it('ConsoleCard muestra título y contenido', () => {
    render(<ConsoleCard title="Motor" subtitle="v2"><p>Cuerpo</p></ConsoleCard>)
    expect(screen.getByText('Motor')).toBeInTheDocument()
    expect(screen.getByText('Cuerpo')).toBeInTheDocument()
  })

  it('StatChip muestra etiqueta y valor', () => {
    render(<StatChip label="Umbral" value="20%" />)
    expect(screen.getByText('Umbral')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('SectionHeader muestra título y conteo', () => {
    render(<SectionHeader title="Coincidencias" count={3} />)
    expect(screen.getByText('Coincidencias')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
