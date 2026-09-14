import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Bug, ChartBar, CheckCircle, FileText, MagnifyingGlass, User } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import Avatar from '../../../components/Avatar/Avatar'
import Button from '../../../components/Button/Button'
import { Select } from '../../../components/Input/Input'
import Lightbox from '../../../components/Lightbox/Lightbox'
import EmptyState from '../../../components/EmptyState/EmptyState'
import {
  findBugReportById,
  findUserById,
  updateBugReportEstado,
  createNotification,
  displayNames,
} from '../../../data/mockData'
import s from './DetalleReporte.module.css'

const ESTADO_VARIANT = {
  pendiente: 'warning',
  en_revision: 'info',
  resuelto: 'success',
  cerrado: 'neutral',
  rechazado: 'danger',
}

const PRIORIDAD_META = {
  baja: { label: 'Baja', variant: 'neutral' },
  media: { label: 'Media', variant: 'warning' },
  alta: { label: 'Alta', variant: 'danger' },
  critica: { label: 'Crítica', variant: 'danger' },
}

const PRIORIDAD_POR_TIPO = {
  sistema: { label: 'Alta', variant: 'danger' },
  proyecto: { label: 'Media', variant: 'warning' },
  datos: { label: 'Media', variant: 'warning' },
  bug_ui: { label: 'Media', variant: 'warning' },
  error_datos: { label: 'Alta', variant: 'danger' },
  rendimiento: { label: 'Alta', variant: 'danger' },
  seguridad: { label: 'Crítica', variant: 'danger' },
  otro: { label: 'Baja', variant: 'neutral' },
}

const ESTADOS = ['pendiente', 'en_revision', 'resuelto', 'cerrado', 'rechazado']

export default function DetalleReporte() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [nuevoEstado, setNuevoEstado] = useState(() => {
    const r = findBugReportById(id)
    return r ? r.estado : 'pendiente'
  })
  const [guardado, setGuardado] = useState(false)
  const [fotoViendo, setFotoViendo] = useState(null)

  const reporte = findBugReportById(id)
  const reportante = reporte && reporte.reporterId ? findUserById(reporte.reporterId) : null
  const prioridadInfo = reporte ? ((reporte.prioridad && PRIORIDAD_META[reporte.prioridad]) || PRIORIDAD_POR_TIPO[reporte.tipo] || PRIORIDAD_META.media) : null

  // Sincroniza el selector al navegar entre reportes sin remontar
  useEffect(() => {
    if (reporte) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNuevoEstado(reporte.estado)
      setGuardado(false)
    }
  }, [reporte?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!reporte) {
    return (
      <DashboardLayout role="admin" titulo="Detalle de Reporte">
        <div className={s.page}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Reporte no encontrado"
            message="El reporte de falla que buscas no existe."
            actionLabel="Volver a reportes de fallas"
            onAction={() => navigate('/admin/reportes-fallas')}
          />
        </div>
      </DashboardLayout>
    )
  }

  const guardarEstado = (e) => {
    e.preventDefault()
    if (nuevoEstado === reporte.estado) return
    updateBugReportEstado(reporte.id, nuevoEstado)
    if (reporte.reporterId) {
      createNotification({
        mensaje: `Tu reporte '${reporte.titulo}' ha pasado a ${
          displayNames.bugReportStatus[nuevoEstado] || nuevoEstado
        }`,
        tipo: 'sistema',
        userId: reporte.reporterId,
        reporteId: reporte.id,
      })
    }
    setGuardado(true)
  }

  return (
    <DashboardLayout role="admin" titulo="Detalle de Reporte">
      <div className={s.page}>
        <PageHeader
          title={reporte.titulo}
          subtitle={`Reporte #${reporte.id} · Recibido el ${reporte.createdAt}`}
          icon={<Bug />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Reportes de Fallas', to: '/admin/reportes-fallas', icon: <Bug size={14} /> },
            { label: `#${reporte.id}` },
          ]}
        />

        {guardado && (
          <p className={s.alertSuccess} role="status">
            <CheckCircle size={14} /> El estado del reporte se actualizó correctamente.
          </p>
        )}

        <DataPanel
          title="Información del reporte"
          icon={<FileText />}
          action={
            <Badge variant={ESTADO_VARIANT[reporte.estado] || 'neutral'} className={s.bigBadge}>
              {displayNames.bugReportStatus[reporte.estado] || reporte.estado}
            </Badge>
          }
        >
          <p className={s.description}>{reporte.descripcion}</p>

          <dl className={s.grid}>
            <div className={s.cell}>
              <dt>Tipo</dt>
              <dd>{displayNames.bugReportType[reporte.tipo] || reporte.tipo}</dd>
            </div>
            <div className={s.cell}>
              <dt>Prioridad</dt>
              <dd>
                <Badge variant={prioridadInfo.variant}>{prioridadInfo.label}</Badge>
              </dd>
            </div>
            <div className={s.cell}>
              <dt>Fecha del reporte</dt>
              <dd>{reporte.createdAt}</dd>
            </div>
            <div className={s.cell}>
              <dt>Última actualización</dt>
              <dd>{reporte.updatedAt || reporte.createdAt}</dd>
            </div>
          </dl>

          <form className={s.statusForm} onSubmit={guardarEstado}>
            <label className={s.statusField}>
              <span className={s.statusLabel}>Cambiar estado</span>
              <Select
                value={nuevoEstado}
                onChange={(e) => {
                  setNuevoEstado(e.target.value)
                  setGuardado(false)
                }}
              >
                {ESTADOS.map((est) => (
                  <option key={est} value={est}>
                    {displayNames.bugReportStatus[est]}
                  </option>
                ))}
              </Select>
            </label>
            <Button
              type="submit"
              disabled={nuevoEstado === reporte.estado}
            >
              <CheckCircle size={14} /> Guardar estado
            </Button>
          </form>
        </DataPanel>

        <DataPanel title="Información del reportante"           icon={<User />}>
          {reportante ? (
            <div className={s.personCard}>
              {reportante.fotoPerfil ? (
                <button type="button" className={s.avatarBtn} title="Ver foto" aria-label="Ver foto del reportante" onClick={() => setFotoViendo({ src: reportante.fotoPerfil, alt: reportante.name })}>
                  <Avatar name={reportante.name} src={reportante.fotoPerfil} size="md" />
                </button>
              ) : (
                <Avatar name={reportante.name} size="md" />
              )}
              <div className={s.personInfo}>
                <span className={s.personName}>{reportante.name}</span>
                <span className={s.personEmail}>{reportante.email}</span>
              </div>
              <Button as="link" to={`/admin/detalle-usuario/${reportante.id}`} viewTransition variant="secondary">
                Ver usuario <ArrowRight size={14} />
              </Button>
            </div>
          ) : (
            <p className={s.muted}>
              Reportado por <strong>{reporte.reporterName}</strong> (usuario no registrado o
              eliminado).
            </p>
          )}
        </DataPanel>
      </div>
          {fotoViendo && <Lightbox src={fotoViendo.src} alt={fotoViendo.alt} caption={fotoViendo.alt} onClose={() => setFotoViendo(null)} />}
</DashboardLayout>
  )
}
