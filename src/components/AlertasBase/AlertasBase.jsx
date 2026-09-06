import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, MagnifyingGlass, CheckCircle, ChatCircle, GearSix } from 'phosphor-react'
import PageHeader from '../PageHeader/PageHeader'
import Badge from '../Badge/Badge'
import Button from '../Button/Button'
import EmptyState from '../EmptyState/EmptyState'
import { useAuth } from '../../contexts/AuthContext'
import {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../data/mockData'
import s from './AlertasBase.module.css'

const TIPO_CONFIG = {
  observacion: { icon: <ChatCircle size={18} />, label: 'Observación', variant: 'primary' },
  similitud: { icon: <MagnifyingGlass size={18} />, label: 'Similitud', variant: 'warning' },
  revision: { icon: <CheckCircle size={18} />, label: 'Revisión', variant: 'info' },
  mensaje: { icon: <ChatCircle size={18} />, label: 'Mensaje', variant: 'neutral' },
  sistema: { icon: <GearSix size={18} />, label: 'Sistema', variant: 'primary' },
}

export default function AlertasBase({ titulo, subtitle, detallePath, emptyActionLabel, emptyActionTo }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [, setTick] = useState(0)
  const refrescar = () => setTick(t => t + 1)

  const notificaciones = useMemo(() => {
    if (!user) return []
    return [...getNotificationsByUser(Number(user.id))].sort((a, b) => b.id - a.id)
  }, [user])

  const sinLeer = useMemo(() => notificaciones.filter(n => !n.leido).length, [notificaciones])

  const marcarTodas = () => {
    if (!user) return
    markAllNotificationsAsRead(Number(user.id))
    refrescar()
  }

  const handleClick = (n) => {
    if (!n.leido) {
      markNotificationAsRead(n.id)
      refrescar()
    }
    if (n.projectId) navigate(`${detallePath}/detalle-proyecto/${n.projectId}`)
    // Solo el admin tiene detalle-reporte; en otros roles solo se marca como leída
    else if (n.reporteId && detallePath === '/admin') navigate(`${detallePath}/detalle-reporte/${n.reporteId}`)
  }

  return (
    <div className={s.wrapper}>
      <PageHeader
        title={titulo}
        subtitle={subtitle}
        icon={<Bell size={20} />}
        actions={
          <Button type="button" variant="secondary" onClick={marcarTodas} disabled={sinLeer === 0}>
            <CheckCircle size={14} /> Marcar todas como leídas
          </Button>
        }
      />

      {sinLeer > 0 && (
        <p className={s.summary}>
          Tienes <strong>{sinLeer}</strong> alerta{sinLeer !== 1 ? 's' : ''} sin leer.
        </p>
      )}

      {notificaciones.length === 0 ? (
        <EmptyState
          icon={<Bell size={40} />}
          title="Sin alertas por ahora"
          message="Cuando haya novedades sobre tus proyectos o similitudes, aparecerán aquí."
          actionLabel={emptyActionLabel}
          onAction={emptyActionTo ? () => navigate(emptyActionTo) : undefined}
        />
      ) : (
        <ul className={s.list}>
          {notificaciones.map(n => {
            const info = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.sistema
            return (
              <li key={n.id}>
                <button type="button" className={`${s.item} ${!n.leido ? s.unread : ''}`} onClick={() => handleClick(n)}>
                  <span className={s.icon} aria-hidden="true">{info.icon}</span>
                  <span className={s.body}>
                    <span className={s.top}>
                      <Badge variant={info.variant}>{info.label}</Badge>
                      {!n.leido && <span className={s.unreadDot}>Nueva</span>}
                      <time className={s.date}>{n.createdAt}</time>
                    </span>
                    <span className={s.message}>{n.mensaje}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
