import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Avatar from '../../../components/Avatar/Avatar'
import Lightbox from '../../../components/Lightbox/Lightbox'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import StatCard from '../../../components/StatCard/StatCard'
import { useAuth } from '../../../contexts/AuthContext'
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
  const [fotoViendo, setFotoViendo] = useState(null)
  const { user } = useAuth()
  const { id } = useParams()
  const companero = findUserById(id)
  const roleVista = user?.rol === 'instructor' ? 'instructor' : 'aprendiz'
  const base = roleVista === 'instructor' ? '/instructor' : '/aprendiz'

  if (!companero) {
    return (
      <DashboardLayout role={roleVista} titulo="Perfil">
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
    <DashboardLayout role={roleVista} titulo="Perfil">
      <div className={s.wrapper}>
        <PageHeader
          title={companero.name}
          subtitle={esAprendiz ? 'Perfil de aprendiz' : 'Perfil de instructor'}
          icon={<User />}
          breadcrumb={[
            { label: 'Dashboard', to: `${base}/dashboard` },
            ...(ficha && esAprendiz
              ? [{ label: 'Mi Ficha', to: `${base}/detalle-ficha/${ficha.id}` }]
              : []),
            { label: companero.name },
          ]}
        />

        <section className={s.profileCard}>
          {companero.fotoPerfil ? (
            <button type="button" className={s.avatarBtn} title="Ver foto" onClick={() => setFotoViendo({ src: companero.fotoPerfil, alt: companero.name })}>
              <Avatar name={companero.name} src={companero.fotoPerfil} size="lg" />
            </button>
          ) : (
            <Avatar name={companero.name} size="lg" />
          )}
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
<StatCard value={proyectos.length} label="Propuestas" centered />
        </section>

        {esAprendiz ? (
          <DataPanel title={`Propuestas de ${companero.name.split(' ')[0]} (${proyectos.length})`} icon={<FolderOpen />}>
            {proyectos.length === 0 ? (
              <p className={s.muted}>Este aprendiz aún no ha registrado propuestas.</p>
            ) : (
              <ul className={s.projectList}>
                {proyectos.map((p) => (
                  <li key={p.id}>
                    <Link to={`${base}/detalle-proyecto/${p.id}`} className={s.projectRow}>
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
              Las propuestas de los instructores no se muestran en esta vista.
            </p>
          </DataPanel>
        )}
      </div>
          {fotoViendo && <Lightbox src={fotoViendo.src} alt={fotoViendo.alt} caption={fotoViendo.alt} onClose={() => setFotoViendo(null)} />}
</DashboardLayout>
  )
}
