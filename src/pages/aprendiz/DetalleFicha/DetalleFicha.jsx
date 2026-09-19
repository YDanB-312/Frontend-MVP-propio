import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Avatar from '../../../components/Avatar/Avatar'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import InformacionFicha from '../../../components/DetalleFichaBase/InformacionFicha'
import { useApi } from '../../../lib/useApi'
import { fichas, proyectos } from '../../../lib/recursos'
import { formatearFecha } from '../../../utils/helpers'
import s from '../../../components/DetalleFichaBase/DetalleFichaBase.module.css'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import { ArrowRight, CalendarBlank, FolderOpen, GraduationCap, IdentificationCard, MagnifyingGlass, Users } from 'phosphor-react'

const ESTADO_LABEL = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }

function nombreUsuario(u) {
  if (!u) return 'Usuario'
  return [u.nombre, u.apellido].filter(Boolean).join(' ').trim() || u.correo || 'Usuario'
}

export default function DetalleFicha() {
  const { id } = useParams()

  // Ficha con sus relaciones y propuestas asociadas.
  const { data: ficha, cargando, error, recargar } = useApi(
    () => fichas.obtener(id),
    [id],
    { inicial: null }
  )
  const { data: todosProyectos } = useApi(() => proyectos.listar(), [], { inicial: [] })

  if (cargando) {
    return (
      <DashboardLayout role="aprendiz" titulo="Detalle de Ficha">
        <div className={s.page}><ApiState cargando /></div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="aprendiz" titulo="Detalle de Ficha">
        <div className={s.page}><ApiState error={error} onReintentar={recargar} /></div>
      </DashboardLayout>
    )
  }

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

  const estudiantes = ficha.apprentices || []
  const programa = ficha.program?.nombre || '—'
  const instructorUserId = ficha.instructor?.generalUser?.id
  const proyectosFicha = todosProyectos.filter((p) => Number(p.id_class_group) === Number(ficha.id))

  return (
    <DashboardLayout role="aprendiz" titulo="Detalle de Ficha">
      <div className={s.page}>
        <PageHeader
          title={ficha.nombre}
          subtitle={`Código ${ficha.codigo} · N° ${ficha.numero} · ${programa}`}
          icon={<GraduationCap />}
          breadcrumb={[
            { label: 'Dashboard', to: '/aprendiz/dashboard' },
            { label: 'Mi Ficha', to: '/aprendiz/ficha' },
          ]}
        />

        <DataPanel title="Información de la ficha" icon={<IdentificationCard />}>
          <InformacionFicha
            ficha={ficha}
            estudiantesCount={estudiantes.length}
            proyectosCount={proyectosFicha.length}
            instructorHref={instructorUserId ? `/aprendiz/perfil-instructor?id=${instructorUserId}` : undefined}
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
              {estudiantes.map((est, i) => {
                const g = est.generalUser || {}
                return (
                  <li key={est.id} className="fx-rise" style={{ '--fx-i': i }}>
                    <Link to={`/aprendiz/perfil-companero/${g.id}`} viewTransition className={s.studentCard}>
                      <Avatar name={nombreUsuario(g)} src={g.foto_url} size="md" />
                      <span className={s.studentInfo}>
                        <span className={s.studentName}>{nombreUsuario(g)}</span>
                        <span className={s.studentEmail}>{g.correo}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </DataPanel>
        )}

        <PropuestasFicha proyectos={proyectosFicha} base="/aprendiz" />
      </div>
    </DashboardLayout>
  )
}

function PropuestasFicha({ proyectos: lista, base }) {
  return (
    <DataPanel title={`Propuestas de la ficha (${lista.length})`} icon={<FolderOpen />}>
      {lista.length === 0 ? (
        <EmptyState
          icon={<FolderOpen />}
          title="Sin propuestas"
          message="Aún no hay propuestas registradas en esta ficha."
        />
      ) : (
        <ul className={s.studentList}>
          {lista.map((p) => (
            <li key={p.id}>
              <Link to={`${base}/detalle-proyecto/${p.id}`} viewTransition className={s.studentRow}>
                <span className={s.studentInfo}>
                  <span className={s.studentName}>{p.titulo}</span>
                  <span className={s.studentEmail}><CalendarBlank size={12} /> {formatearFecha(p.created_at)}</span>
                </span>
                <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>
                  {ESTADO_LABEL[p.estado] || p.estado}
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
