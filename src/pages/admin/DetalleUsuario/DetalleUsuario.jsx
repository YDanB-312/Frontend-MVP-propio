import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { User, IdentificationCard, FolderOpen, Pause, Play, MagnifyingGlass, ChartBar, Users } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import Avatar from '../../../components/Avatar/Avatar'
import Lightbox from '../../../components/Lightbox/Lightbox'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import {
  findUserById,
  findFichaById,
  getProjectsByStudent,
  getAllSimilarities,
  setUserActive,
  displayNames,
} from '../../../data/mockData'
import s from './DetalleUsuario.module.css'

const ESTADO_VARIANT = {
  pendiente: 'warning',
  en_revision: 'info',
  aprobado: 'success',
  rechazado: 'danger',
  requiere_ajustes: 'warning',
}

const ROL_VARIANT = { aprendiz: 'info', instructor: 'primary', admin: 'warning' }

function similitudInfo(similitudes, projectId) {
  const propias = similitudes.filter((x) => x.projectId1 === projectId || x.projectId2 === projectId)
  if (propias.length === 0) return null
  return {
    pct: Math.max(...propias.map((x) => Math.round(x.similitud * 100))),
    count: propias.length,
  }
}

export default function DetalleUsuario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [modalEstado, setModalEstado] = useState(false)
  const [fotoViendo, setFotoViendo] = useState(null)

  const usuario = findUserById(id)
  const proyectos = usuario && usuario.role === 'aprendiz' ? getProjectsByStudent(usuario.id) : []
  const similitudes = getAllSimilarities()

  if (!usuario) {
    return (
      <DashboardLayout role="admin" titulo="Detalle de Usuario">
        <div className={s.page}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Usuario no encontrado"
            message="El usuario que buscas no existe o fue eliminado."
            actionLabel="Volver a usuarios"
            onAction={() => navigate('/admin/gestion-usuarios')}
          />
        </div>
      </DashboardLayout>
    )
  }

  const activo = usuario.estado === 1
  const ficha = usuario.fichaId ? findFichaById(usuario.fichaId) : null

  const confirmarCambioEstado = () => {
    setUserActive(usuario.id, !activo)
    setModalEstado(false)
  }

  return (
    <DashboardLayout role="admin" titulo="Detalle de Usuario">
      <div className={s.page}>
        <PageHeader
          title={usuario.name}
          subtitle={`Cuenta ${displayNames.userRole[usuario.role] || usuario.role} · ${
            activo ? 'Activa' : 'Inactiva'
          }`}
          icon={<User />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Usuarios', to: '/admin/usuarios', icon: <Users size={14} /> },
            { label: usuario.name },
          ]}
        />

        <DataPanel title="Perfil del usuario" icon={<IdentificationCard />}>
          <div className={s.profile}>
            {usuario.fotoPerfil ? (
              <button type="button" className={s.avatarBtn} title="Ver foto" onClick={() => setFotoViendo({ src: usuario.fotoPerfil, alt: usuario.name })}>
                <Avatar name={usuario.name} src={usuario.fotoPerfil} size="lg" />
              </button>
            ) : (
              <Avatar name={usuario.name} size="lg" />
            )}
            <div className={s.profileInfo}>
              <h2 className={s.name}>{usuario.name}</h2>
              <p className={s.email}>{usuario.email}</p>
              <div className={s.tags}>
                <Badge variant={ROL_VARIANT[usuario.role] || 'primary'}>{displayNames.userRole[usuario.role] || usuario.role}</Badge>
                {activo ? <Badge variant="success">Activo</Badge> : <Badge variant="danger">Inactivo</Badge>}
              </div>
              <Button
                type="button"
                variant={activo ? 'danger' : 'success'}
                onClick={() => setModalEstado(true)}
              >
                {activo ? <><Pause size={14} /> Desactivar cuenta</> : <><Play size={14} /> Activar cuenta</>}
              </Button>
            </div>
            <dl className={s.details}>
              <div className={s.detail}>
                <dt>Ficha</dt>
                <dd>{ficha ? `${ficha.codigo} — ${ficha.nombre}` : 'Sin ficha'}</dd>
              </div>
              {usuario.role === 'aprendiz' && (
                <div className={s.detail}>
                  <dt>Programa</dt>
                  <dd>{usuario.programa || 'No asignado'}</dd>
                </div>
              )}
            </dl>
          </div>
        </DataPanel>

        {usuario.role === 'aprendiz' && (
          <DataPanel title={`Propuestas del aprendiz (${proyectos.length})`} icon={<FolderOpen />}>
            {proyectos.length === 0 ? (
              <EmptyState
                icon={<FolderOpen />}
                title="Sin propuestas"
                message="Este aprendiz aún no ha registrado ninguna propuesta."
              />
            ) : (
              <ul className={s.projectList}>
                {proyectos.map((p) => {
                  const info = similitudInfo(similitudes, p.id)
                  return (
                    <li key={p.id}>
                      <Link to={`/admin/detalle-proyecto/${p.id}`} className={s.projectRow}>
                        <span className={s.projectInfo}>
                          <span className={s.projectTitle}>{p.title}</span>
                          <span className={s.projectMeta}>Enviado el {p.createdAt}</span>
                        </span>
                        {info && (
                          <Badge variant={info.pct >= 70 ? 'danger' : info.pct >= 40 ? 'warning' : 'success'}>
                            <MagnifyingGlass size={12} /> {info.pct}% · {info.count}
                          </Badge>
                        )}
                        <Badge variant={ESTADO_VARIANT[p.estado] || 'neutral'}>
                          {displayNames.projectStatus[p.estado] || p.estado}
                        </Badge>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </DataPanel>
        )}
      </div>

      <ConfirmModal
        open={!!modalEstado}
        titulo={activo ? 'Desactivar cuenta' : 'Activar cuenta'}
        mensaje={
          activo
            ? `¿Seguro que deseas desactivar la cuenta de "${usuario.name}"? No podrá iniciar sesión hasta que la reactives.`
            : `¿Deseas reactivar la cuenta de "${usuario.name}"? Volverá a poder iniciar sesión normalmente.`
        }
        textoConfirmar={activo ? 'Sí, desactivar' : 'Sí, activar'}
        onConfirmar={confirmarCambioEstado}
        onCancelar={() => setModalEstado(false)}
      />

      {fotoViendo && (
        <Lightbox src={fotoViendo.src} alt={fotoViendo.alt} caption={fotoViendo.alt} onClose={() => setFotoViendo(null)} />
      )}
    </DashboardLayout>
  )
}
