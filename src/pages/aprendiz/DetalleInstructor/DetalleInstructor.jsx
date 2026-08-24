import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Avatar from '../../../components/Avatar/Avatar'
import Lightbox from '../../../components/Lightbox/Lightbox'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import StatCard from '../../../components/StatCard/StatCard'
import { useAuth } from '../../../contexts/AuthContext'
import { findUserById, findFichaById, getAllFichas } from '../../../data/mockData'
import s from './DetalleInstructor.module.css'
import { Books, CaretRight, ChalkboardTeacher, Envelope, GraduationCap, MagnifyingGlass, Phone } from 'phosphor-react'

export default function DetalleInstructor() {
  const [fotoViendo, setFotoViendo] = useState(null)
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const miPerfil = findUserById(user.id)
  const miFicha = findFichaById(miPerfil?.fichaId)
  const instructorId = searchParams.get('id') || miFicha?.instructorId
  const instructor = instructorId ? findUserById(instructorId) : null

  if (!instructor || instructor.role !== 'instructor') {
    return (
      <DashboardLayout role="aprendiz" titulo="Mi Instructor">
        <div className={s.wrapper}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Sin instructor asignado"
            message="Aún no tienes una ficha con instructor asignado. Únete a una ficha para conocer a tu instructor."
            actionLabel="Unirme a una ficha"
            actionIcon={<GraduationCap size={14} />}
          />
        </div>
      </DashboardLayout>
    )
  }

  const fichas = getAllFichas().filter((f) => f.instructorId === instructor.id)

  return (
    <DashboardLayout role="aprendiz" titulo="Mi Instructor">
      <div className={s.wrapper}>
        <PageHeader
          title="Mi Instructor"
          subtitle="Conoce a quien acompaña tu proceso de formación"
          icon={<ChalkboardTeacher />}
          breadcrumb={[
            { label: 'Dashboard', to: '/aprendiz/dashboard' },
            { label: 'Mi Instructor' },
          ]}
        />

        <section className={s.profileCard}>
          {instructor.fotoPerfil ? (
            <button type="button" className={s.avatarBtn} title="Ver foto" onClick={() => setFotoViendo({ src: instructor.fotoPerfil, alt: instructor.name })}>
              <Avatar name={instructor.name} src={instructor.fotoPerfil} size="lg" />
            </button>
          ) : (
            <Avatar name={instructor.name} size="lg" />
          )}
          <div className={s.profileInfo}>
            <h2 className={s.profileName}>{instructor.name}</h2>
            <Badge variant="warning"><ChalkboardTeacher size={14} /> Instructor</Badge>
            <p className={s.profileEmail}><Envelope size={14} /> {instructor.email}</p>
            {instructor.telefono && <p className={s.profileMeta}><Phone size={14} /> {instructor.telefono}</p>}
            {instructor.areaEncargada && (
              <p className={s.profileMeta}><Books size={14} /> Área: {instructor.areaEncargada}</p>
            )}
          </div>
<StatCard value={fichas.length} label={fichas.length === 1 ? 'Ficha a cargo' : 'Fichas a cargo'} centered />
        </section>

        <DataPanel title={`Fichas de ${instructor.name.split(' ')[0]} (${fichas.length})`} icon={<GraduationCap />}>
          {fichas.length === 0 ? (
            <p className={s.muted}>Este instructor no tiene fichas asignadas actualmente.</p>
          ) : (
            <ul className={s.fichaList}>
              {fichas.map((f) => (
                <li key={f.id}>
                  <Link to={`/aprendiz/detalle-ficha/${f.id}`} className={s.fichaRow}>
                    <span className={s.fichaInfo}>
                      <span className={s.fichaNombre}>{f.nombre}</span>
                      <span className={`${s.fichaCodigo} ${s.mono}`}>{f.codigo}</span>
                    </span>
                    <span className={s.fichaSide}>
                      <Badge variant="info">{f.programa}</Badge>
                      <Badge variant={f.estado === 'activo' ? 'success' : 'danger'}>
                        {f.estado === 'activo' ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <span className={s.chevron} aria-hidden="true"><CaretRight size={22} /></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DataPanel>
      </div>
          {fotoViendo && <Lightbox src={fotoViendo.src} alt={fotoViendo.alt} caption={fotoViendo.alt} onClose={() => setFotoViendo(null)} />}
</DashboardLayout>
  )
}
