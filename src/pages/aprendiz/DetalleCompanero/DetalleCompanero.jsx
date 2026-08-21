import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Avatar from '../../../components/Avatar/Avatar'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { findUserById, findFichaById, getProjectsByStudent, displayNames } from '../../../data/mockData'
import s from './DetalleCompanero.module.css'
import { Books, CalendarBlank, ChalkboardTeacher, Envelope, FolderOpen, GraduationCap, Info, MagnifyingGlass, Phone, User } from 'phosphor-react'

const ESTADO_VARIANT = {
  aprobado: 'success',
  completado: 'success',
  pendiente: 'warning',
  requiere_ajustes: 'warning',
  en_revision: 'info',
  en_progreso: 'primary',
  rechazado: 'danger',
  cancelado: 'danger',
  borrador: 'neutral',
}

export default function DetalleCompanero() {
  const { id } = useParams()
  const companero = findUserById(id)

  if (!companero) {
    return (
      <DashboardLayout role="aprendiz" titulo="Perfil">
        <div className={s.wrapper}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Usuario no encontrado"
            message="El perfil que buscas no existe o fue eliminado."
          />
        </div>
      </DashboardLayout>
    )
  }

  const esAprendiz = companero.role === 'aprendiz'
  const ficha = findFichaById(companero.fichaId)
  const proyectos = esAprendiz ? getProjectsByStudent(companero.id) : []

  return (
    <DashboardLayout role="aprendiz" titulo="Perfil">
      <div className={s.wrapper}>
        <PageHeader
          title={companero.name}
          subtitle={esAprendiz ? 'Perfil de aprendiz' : 'Perfil de instructor'}
          icon={<User />}
          breadcrumb={[
            { label: 'Dashboard', to: '/aprendiz/dashboard' },
            ...(ficha && esAprendiz
              ? [{ label: 'Mi Ficha', to: `/aprendiz/detalle-ficha/${ficha.id}` }]
              : []),
            { label: companero.name },
          ]}
        />

        <section className={s.profileCard}>
          <Avatar name={companero.name} size="lg" />
          <div className={s.profileInfo}>
            <h2 className={s.profileName}>{companero.name}</h2>
            <Badge variant={esAprendiz ? 'success' : 'warning'}>
              {esAprendiz ? <><GraduationCap size={14} /> Aprendiz</> : <><ChalkboardTeacher size={14} /> Instructor</>}
            </Badge>
            <p className={s.profileEmail}><Envelope size={14} /> {companero.email}</p>
            {companero.telefono && <p className={s.profileMeta}><Phone size={14} /> {companero.telefono}</p>}
            {esAprendiz && (
              <p className={s.profileMeta}>
                <GraduationCap size={14} /> {ficha ? `${ficha.nombre} · ${ficha.codigo}` : companero.programa || 'Sin ficha'}
              </p>
            )}
            {!esAprendiz && companero.areaEncargada && (
              <p className={s.profileMeta}><Books size={14} /> Área: {companero.areaEncargada}</p>
            )}
          </div>
          <div className={s.profileStat}>
            <span className={s.statValue}>{proyectos.length}</span>
            <span className={s.statLabel}>Proyectos</span>
          </div>
        </section>

        {esAprendiz ? (
          <DataPanel title={`Proyectos de ${companero.name.split(' ')[0]} (${proyectos.length})`} icon={<FolderOpen />}>
            {proyectos.length === 0 ? (
              <p className={s.muted}>Este aprendiz aún no ha registrado proyectos.</p>
            ) : (
              <ul className={s.projectList}>
                {proyectos.map((p) => (
                  <li key={p.id}>
                    <Link to={`/aprendiz/detalle-proyecto/${p.id}`} className={s.projectRow}>
                      <span className={s.projectInfo}>
                        <span className={s.projectTitle}>{p.title}</span>
                        <span className={s.projectMeta}><CalendarBlank size={14} /> {p.createdAt}</span>
                      </span>
                      <Badge variant={ESTADO_VARIANT[p.estado] || 'neutral'}>
                        {displayNames.projectStatus[p.estado] || p.estado}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DataPanel>
        ) : (
          <DataPanel title="Información adicional" icon={<Info />}>
            <p className={s.muted}>
              Este usuario es instructor{companero.areaEncargada ? ` del área de ${companero.areaEncargada}` : ''}.
              Los proyectos de los instructores no se muestran en esta vista.
            </p>
          </DataPanel>
        )}
      </div>
    </DashboardLayout>
  )
}
