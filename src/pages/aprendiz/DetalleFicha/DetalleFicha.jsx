import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Avatar from '../../../components/Avatar/Avatar'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import InformacionFicha from '../../../components/DetalleFichaBase/InformacionFicha'
import { findFichaById, getEstudiantesDeFicha, getProjectsByFicha, displayNames } from '../../../data/mockData'
import s from '../../../components/DetalleFichaBase/DetalleFichaBase.module.css'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import { ArrowRight, CalendarBlank, FolderOpen, GraduationCap, IdentificationCard, MagnifyingGlass, Users } from 'phosphor-react'

export default function DetalleFicha() {
  const { id } = useParams()
  const ficha = findFichaById(id)
  const estudiantes = ficha ? getEstudiantesDeFicha(ficha.id) : []

  if (!ficha) {
    return (
      <DashboardLayout role="aprendiz" titulo="Detalle de Ficha">
        <div className={s.page}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Ficha no encontrada"
            message="La ficha que buscas no existe o fue eliminada."
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Detalle de Ficha">
      <div className={s.page}>
        <PageHeader
          title={ficha.nombre}
          subtitle={`Código ${ficha.codigo} · N° ${ficha.numero} · ${ficha.programa}`}
          icon={<GraduationCap />}
          breadcrumb={[
            { label: 'Dashboard', to: '/aprendiz/dashboard' },
            { label: 'Mi Ficha', to: '/aprendiz/ficha' },
          ]}
        />

        <DataPanel title="Información de la ficha" icon={<IdentificationCard />}>
          <InformacionFicha
            ficha={ficha}
            estudiantesCount={estudiantes.length || ficha.aprendices || 0}
            proyectosCount={getProjectsByFicha(ficha.id).length}
            instructorHref={ficha.instructorId ? `/aprendiz/perfil-instructor?id=${ficha.instructorId}` : undefined}
          />
        </DataPanel>

        {estudiantes.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Sin aprendices registrados"
            message="Aún no hay aprendices vinculados a esta ficha."
          />
        ) : (
          <DataPanel title={`Integrantes de la ficha (${estudiantes.length})`} icon={<Users />}>
            <ul className={s.studentsGrid}>
              {estudiantes.map((est, i) => (
                <li key={est.id} className="fx-rise" style={{ '--fx-i': i }}>
                  <Link to={`/aprendiz/perfil-companero/${est.id}`} viewTransition className={s.studentCard}>
                    <Avatar name={est.name} src={est.fotoPerfil} size="md" />
                    <span className={s.studentInfo}>
                      <span className={s.studentName}>{est.name}</span>
                      <span className={s.studentEmail}>{est.email}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </DataPanel>
        )}

        <PropuestasFicha fichaId={ficha.id} base="/aprendiz" />
      </div>
    </DashboardLayout>
  )
}

function PropuestasFicha({ fichaId, base }) {
  const proyectos = getProjectsByFicha(fichaId)
  return (
    <DataPanel title={`Propuestas de la ficha (${proyectos.length})`} icon={<FolderOpen />}>
      {proyectos.length === 0 ? (
        <EmptyState
          icon={<FolderOpen />}
          title="Sin propuestas"
          message="Aún no hay propuestas registradas en esta ficha."
        />
      ) : (
        <ul className={s.studentList}>
          {proyectos.map((p) => (
            <li key={p.id}>
              <Link to={`${base}/detalle-proyecto/${p.id}`} viewTransition className={s.studentRow}>
                <span className={s.studentInfo}>
                  <span className={s.studentName}>{p.title}</span>
                  <span className={s.studentEmail}><CalendarBlank size={12} /> {p.createdAt}</span>
                </span>
                <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>
                  {displayNames.projectStatus[p.estado] || p.estado}
                </Badge>
                <span className={s.arrow} aria-hidden="true"><ArrowRight size={22} /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DataPanel>
  )
}
