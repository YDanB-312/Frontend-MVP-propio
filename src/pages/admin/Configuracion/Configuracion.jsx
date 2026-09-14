import { Link } from 'react-router-dom'
import { CaretRight } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import ConsoleCard from '../../../components/ConsoleCard/ConsoleCard'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import { ArchiveBox, ChartBar, GearSix, ShareNetwork, SlidersHorizontal, Buildings } from 'phosphor-react'
import { getRedes, getCentros, getConfigMotor } from '../../../data/mockData'
import s from './Configuracion.module.css'

export default function Configuracion() {
  const umbral = Math.round(getConfigMotor().umbral * 100)
  const meses = getConfigMotor().meses

  const items = [
    {
      to: '/admin/redes-conocimiento',
      icon: <ShareNetwork size={24} weight="regular" />,
      titulo: 'Redes de conocimiento',
      descripcion: `${getRedes().length} redes con sus programas de formación`,
    },
    {
      to: '/admin/centros',
      icon: <Buildings size={24} weight="regular" />,
      titulo: 'Centros de formación',
      descripcion: `${getCentros().length} sedes regionales registradas`,
    },
    {
      to: '/admin/config-similitud',
      icon: <SlidersHorizontal size={24} weight="regular" />,
      titulo: 'Motor de similitud',
      descripcion: `Umbral ${umbral}% · corpus de ${meses} meses`,
    },
  ]

  return (
    <DashboardLayout role="admin" titulo="Configuración">
      <div>
        <PageHeader
          title="Configuración"
          subtitle="Todo lo configurable de la plataforma en un solo lugar."
          icon={<GearSix />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Configuración' },
          ]}
        />
        <ConsoleCard title="Secciones" icon={<ArchiveBox />}>
          <SectionHeader title="Elige una sección" count={items.length} className={s.subhead} />
          <div className={s.grid}>
            {items.map((item, i) => (
              <div key={item.to} className="fx-rise" style={{ '--fx-i': i }}>
              <Link to={item.to} viewTransition className={s.tile}>
                <span className={s.tileIcon} aria-hidden="true">{item.icon}</span>
                <span className={s.tileText}>
                  <span className={s.tileTitle}>{item.titulo}</span>
                  <span className={s.tileDesc}>{item.descripcion}</span>
                </span>
                <CaretRight size={16} className={s.tileChevron} aria-hidden="true" />
              </Link>
              </div>
            ))}
          </div>
        </ConsoleCard>
      </div>
    </DashboardLayout>
  )
}
