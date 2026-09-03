import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import { useAuth } from '../../../contexts/AuthContext'
import { findUserById, findFichaById, getProjectsByStudent, displayNames } from '../../../data/mockData'
import s from '../../../components/PersonaDetalleBase/PersonaDetalleBase.module.css'
import { CalendarBlank, FolderOpen, Info, MagnifyingGlass } from 'phosphor-react'

const ESTADO_VARIANT = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
}

export default function DetalleCompanero() {
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
  const rolLabel = `${displayNames.userRole[companero.role] || companero.role} SENA`

  return (
    <DashboardLayout role={roleVista} titulo="Perfil">
      <div className={s.wrapper}>
        <PerfilBase
          user={companero}
          role={companero.role}
          soloLectura
          titulo={companero.name}
          subtitulo={esAprendiz ? 'Perfil de aprendiz' : 'Perfil de instructor'}
          breadcrumb={[
            { label: 'Dashboard', to: `${base}/dashboard` },
            ...(ficha && esAprendiz
              ? [{ label: 'Mi Ficha', to: `${base}/detalle-ficha/${ficha.id}` }]
              : []),
            { label: companero.name },
          ]}
          detalles={
            esAprendiz
              ? [
                  { label: 'Rol', value: rolLabel },
                  { label: 'Ficha', value: ficha ? `${ficha.nombre} (${ficha.codigo})` : 'Sin ficha asignada' },
                ]
              : [{ label: 'Rol', value: rolLabel }]
          }
        />

        {esAprendiz ? (
          <DataPanel title={`Propuestas de ${companero.name.split(' ')[0]} (${proyectos.length})`} icon={<FolderOpen />}>
            {proyectos.length === 0 ? (
              <p className={s.muted}>Este aprendiz aún no ha registrado propuestas.</p>
            ) : (
              <ul className={s.list}>
                {proyectos.map((p) => (
                  <li key={p.id}>
                    <Link to={`${base}/detalle-proyecto/${p.id}`} className={s.row}>
                      <span className={s.rowInfo}>
                        <span className={s.rowTitle}>{p.title}</span>
                        <span className={s.rowMeta}><CalendarBlank size={14} /> {p.createdAt}</span>
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
              Este usuario es instructor.
              Las propuestas de los instructores no se muestran en esta vista.
            </p>
          </DataPanel>
        )}
      </div>
    </DashboardLayout>
  )
}
