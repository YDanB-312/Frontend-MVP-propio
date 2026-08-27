import { Link, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import { useAuth } from '../../../contexts/AuthContext'
import { findUserById, findFichaById, getAllFichas } from '../../../data/mockData'
import s from './DetalleInstructor.module.css'
import { CaretRight, GraduationCap, MagnifyingGlass } from 'phosphor-react'

export default function DetalleInstructor() {
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
        <PerfilBase
          user={instructor}
          role="instructor"
          soloLectura
          titulo="Mi Instructor"
          subtitulo="Conoce a quien acompaña tu proceso de formación"
          breadcrumb={[
            { label: 'Dashboard', to: '/aprendiz/dashboard' },
            { label: 'Mi Instructor' },
          ]}
          detalles={[{ label: 'Rol', value: 'Instructor SENA' }]}
        />

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
    </DashboardLayout>
  )
}
