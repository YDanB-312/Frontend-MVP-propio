import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Bug, ChartBar, CheckCircle, FileText, MagnifyingGlass, User, Warning } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import StatusMark from '../../../components/StatusMark/StatusMark'
import { REPORTE_STATUS } from '../../../constants/estadoStatus'
import Avatar from '../../../components/Avatar/Avatar'
import Button from '../../../components/Button/Button'
import { Select } from '../../../components/Input/Input'
import Lightbox from '../../../components/Lightbox/Lightbox'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import { useApi } from '../../../lib/useApi'
import { reportes, notificaciones } from '../../../lib/recursos'
import { fechaDesdeApi, fechaHoyLocal } from '../../../utils/helpers'
import s from './DetalleReporte.module.css'

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  en_revision: 'En Revisión',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
  rechazado: 'Rechazado',
}

const TIPO_LABEL = {
  sistema: 'Sistema',
  proyecto: 'Proyecto',
  datos: 'Datos',
  bug_ui: 'Interfaz',
  error_datos: 'Error de datos',
  rendimiento: 'Rendimiento',
  seguridad: 'Seguridad',
  otro: 'Otro',
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

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

export default function DetalleReporte() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [nuevoEstado, setNuevoEstado] = useState('pendiente')
  const [guardado, setGuardado] = useState(false)
  const [accionMsg, setAccionMsg] = useState(null)
  const [fotoViendo, setFotoViendo] = useState(null)

  // Fuente única: la API (reporte + usuario reportante incluido).
  const { data: reporte, cargando, error, recargar } = useApi(
    () => reportes.obtener(id),
    [id],
    { inicial: null }
  )

  // Sincroniza el selector al navegar entre reportes sin remontar.
  useEffect(() => {
    if (reporte) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNuevoEstado(reporte.estado || 'pendiente')
      setGuardado(false)
    }
  }, [reporte?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (cargando || error || !reporte) {
    return (
      <DashboardLayout role="admin" titulo="Detalle de Reporte">
        <div className={s.page}>
          {error ? (
            <EmptyState
              icon={<MagnifyingGlass />}
              title="No se pudo cargar el reporte"
              message={error.message || 'Ocurrió un error al consultar la API.'}
              actionLabel="Reintentar"
              onAction={recargar}
            />
          ) : cargando ? (
            <ApiState cargando error={null} />
          ) : (
            <EmptyState
              icon={<MagnifyingGlass />}
              title="Reporte no encontrado"
              message="El reporte de falla que buscas no existe."
              actionLabel="Volver a reportes de fallas"
              onAction={() => navigate('/admin/reportes-fallas')}
            />
          )}
        </div>
      </DashboardLayout>
    )
  }

  const reportante = reporte.generalUser || null
  const prioridadInfo = PRIORIDAD_POR_TIPO[reporte.tipo] || PRIORIDAD_META.media

  const guardarEstado = async (e) => {
    e.preventDefault()
    if (nuevoEstado === reporte.estado) return
    setAccionMsg(null)
    try {
      await reportes.actualizar(reporte.id, {
        titulo: reporte.titulo,
        descripcion: reporte.descripcion,
        tipo: reporte.tipo,
        estado: nuevoEstado,
        fecha: reporte.fecha,
        id_usuario: reporte.id_usuario,
      })
      // Aviso al reportante (best-effort): informativo, sin enlace (el rol
      // aprendiz/instructor no tiene vista de detalle de reporte → evita un
      // enlace sin destino). No bloquea la actualización.
      await notificaciones.crear({
        titulo: `Tu reporte '${reporte.titulo}' ha pasado a ${ESTADO_LABEL[nuevoEstado] || nuevoEstado}`,
        tipo: 'sistema',
        enlace: null,
        leida: false,
        fecha: fechaHoyLocal(),
        id_usuario: reporte.id_usuario,
      }).catch(() => null)
      await recargar()
      setGuardado(true)
    } catch (err) {
      setAccionMsg(err?.data?.message || 'No se pudo actualizar el estado del reporte.')
    }
  }

  return (
    <DashboardLayout role="admin" titulo="Detalle de Reporte">
      <div className={s.page}>
        <PageHeader
          title={reporte.titulo}
          subtitle={`Reporte #${reporte.id} · Recibido el ${fechaDesdeApi(reporte.fecha)}`}
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

        {accionMsg && (
          <p className={s.alertSuccess} role="alert" style={{ color: 'var(--c-danger, #c0392b)' }}>
            <Warning size={14} /> {accionMsg}
          </p>
        )}

        <DataPanel
          title="Información del reporte"
          icon={<FileText />}
          action={
            <StatusMark status={REPORTE_STATUS[reporte.estado] || 'pending'} label={ESTADO_LABEL[reporte.estado] || reporte.estado} />
          }
        >
          <p className={s.description}>{reporte.descripcion}</p>

          <dl className={s.grid}>
            <div className={s.cell}>
              <dt>Tipo</dt>
              <dd>{TIPO_LABEL[reporte.tipo] || reporte.tipo}</dd>
            </div>
            <div className={s.cell}>
              <dt>Prioridad</dt>
              <dd>
                <Badge variant={prioridadInfo.variant}>{prioridadInfo.label}</Badge>
              </dd>
            </div>
            <div className={s.cell}>
              <dt>Fecha del reporte</dt>
              <dd>{fechaDesdeApi(reporte.fecha)}</dd>
            </div>
            <div className={s.cell}>
              <dt>Última actualización</dt>
              <dd>{fechaDesdeApi(reporte.updated_at || reporte.fecha)}</dd>
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
                    {ESTADO_LABEL[est]}
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

        <DataPanel title="Información del reportante" icon={<User />}>
          {reportante ? (
            <div className={s.personCard}>
              {reportante.foto_url ? (
                <button type="button" className={s.avatarBtn} title="Ver foto" aria-label="Ver foto del reportante" onClick={() => setFotoViendo({ src: reportante.foto_url, alt: nombreCompleto(reportante) })}>
                  <Avatar name={nombreCompleto(reportante)} src={reportante.foto_url} size="md" />
                </button>
              ) : (
                <Avatar name={nombreCompleto(reportante)} size="md" />
              )}
              <div className={s.personInfo}>
                <span className={s.personName}>{nombreCompleto(reportante)}</span>
                <span className={s.personEmail}>{reportante.correo}</span>
              </div>
              <Button as="link" to={`/admin/detalle-usuario/${reportante.id}`} viewTransition variant="secondary">
                Ver usuario <ArrowRight size={14} />
              </Button>
            </div>
          ) : (
            <p className={s.muted}>
              Reportado por <strong>{`Usuario #${reporte.id_usuario}`}</strong> (usuario no registrado o
              eliminado).
            </p>
          )}
        </DataPanel>
      </div>
      {fotoViendo && <Lightbox src={fotoViendo.src} alt={fotoViendo.alt} caption={fotoViendo.alt} onClose={() => setFotoViendo(null)} />}
    </DashboardLayout>
  )
}
