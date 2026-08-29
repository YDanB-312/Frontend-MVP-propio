import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChartBar } from 'phosphor-react'
import MetricCard from './MetricCard'

describe('MetricCard', () => {
  it('muestra el valor y la etiqueta', () => {
    render(<MetricCard icon={<ChartBar />} label="Proyectos" value="12" />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Proyectos')).toBeInTheDocument()
  })

  it('muestra la tendencia cuando se provee', () => {
    render(<MetricCard icon={<ChartBar />} label="Proyectos" value="12" trend="+2" trendDir="up" />)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('no muestra tendencia si no se pasa', () => {
    render(<MetricCard icon={<ChartBar />} label="Proyectos" value="12" />)
    expect(screen.queryByText('+2')).not.toBeInTheDocument()
  })

  it('aplica la variante primaria por defecto', () => {
    const { container } = render(<MetricCard icon={<ChartBar />} label="P" value="1" />)
    expect(container.querySelector('div').className).toContain('primary')
  })
})
