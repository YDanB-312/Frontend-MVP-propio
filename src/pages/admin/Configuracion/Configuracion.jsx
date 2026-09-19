import { Link } from 'react-router-dom'
import { CaretRight } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import ConsoleCard from '../../../components/ConsoleCard/ConsoleCard'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import { ArchiveBox, ChartBar, GearSix, ShareNetwork, SlidersHorizontal, Buildings } from 'phosphor-react'
import { useApi } from '../../../lib/useApi'
import { redes, centros, motor } from '../../../lib/recursos'
import s from './Configuracion.module.css'

export default function Configuracion() {
  // Fuente única: la API. Conteos de catálogos y lectura vigente del motor.
  const { data } = useApi(
    async () => {
      const [listaRedes, listaCentros, configMotor] = await Promise.all([
        redes.listar(),
        centros.listar(),
        motor.obtener(),
      ])
      return { listaRedes, listaCentros, configMotor }
    },
    [],
    { inicial: null }
  )

  const listaRedes = data?.listaRedes || []
  const listaCentros = data?.listaCentros || []
  const configMotor = data?.configMotor || { umbral: 0.2, meses: 12 }
  const umbral = Math.round(configMotor.umbral * 100)
  const meses = configMotor.meses

  const items = [
    {
      to: '/admin/redes-conocimiento',
      icon: <ShareNetwork size={24} weight="regular" />,
      titulo: 'Redes de conocimiento',
      descripcion: `${listaRedes.length} redes con sus programas de formación`,
    },
    {
      to: '/admin/training-centers',
      icon: <Buildings size={24} weight="regular" />,
      titulo: 'Centros de formación',
      descripcion: `${listaCentros.length} sedes regionales registradas`,
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
