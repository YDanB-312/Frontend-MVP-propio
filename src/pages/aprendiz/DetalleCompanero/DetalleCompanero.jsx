import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { usuarios, aprendices, fichas, proyectos, similitudes as similitudesApi, INCLUDE_PROYECTOS } from '../../../lib/recursos'
import { PROJECT_ESTADO_VARIANT, PROJECT_ESTADO_LABEL as ESTADO_LABEL, ROL_LABEL } from '../../../constants/badgeVariants'
import { formatearFecha, esPropietarioProyecto, infoSimilitud, nombreCompleto } from '../../../utils/helpers'
import s from '../../../components/PersonaDetalleBase/PersonaDetalleBase.module.css'
import { CalendarBlank, FolderOpen, Info, MagnifyingGlass } from 'phosphor-react'



// Una propuesta es del usuario si la creó o si figura en su equipo.
const esMia = esPropietarioProyecto
export default function DetalleCompanero() {
  const { user } = useAuth()
  const { id } = useParams()
  const roleVista = user?.rol === 'instructor' ? 'instructor' : 'aprendiz'
  const base = roleVista === 'instructor' ? '/instructor' : '/aprendiz'

  // Perfil consultado y datos académicos: fuente única la API.
  const { data: companero, cargando, error, recargar } = useApi(
    () => usuarios.perfil(id),
    [id],
    { inicial: null }
  )
  const { data: aprendicesApi } = useApi(() => aprendices.listar(), [], { inicial: [] })
  const { data: fichasApi } = useApi(() => fichas.listar(), [], { inicial: [] })
  const { data: todosProyectos } = useApi(
    () => proyectos.listar({ included: INCLUDE_PROYECTOS }),
    [],
    { inicial: [] }
  )
  const { data: todasSimilitudesApi } = useApi(() => similitudesApi.listar(), [], { inicial: [] })

  const esAprendiz = companero?.rol === 'aprendiz'
  const miAprendiz = useMemo(
    () => aprendicesApi.find((a) => Number(a.id_usuario) === Number(id)) || null,
    [aprendicesApi, id]
  )
  const ficha = miAprendiz
    ? fichasApi.find((f) => Number(f.id) === Number(miAprendiz.id_class_group)) || null
    : null

  const proyectosUsuario = useMemo(
    () => (esAprendiz ? todosProyectos.filter((p) => esMia(p, id)) : []),
    [todosProyectos, id, esAprendiz]
  )
  const idsProyectos = useMemo(() => new Set(proyectosUsuario.map((p) => Number(p.id))), [proyectosUsuario])
  const similitudesValidas = useMemo(
    () => todasSimilitudesApi.filter(
      (x) => idsProyectos.has(Number(x.id_proyecto_1)) || idsProyectos.has(Number(x.id_proyecto_2))
    ),
    [todasSimilitudesApi, idsProyectos]
  )

  function similitudMax(projectId) {
    return infoSimilitud(similitudesValidas, projectId)?.pct ?? null
  }

  if (cargando) {
    return (
      <DashboardLayout role={roleVista} titulo="Perfil">
        <div className={s.wrapper}><ApiState cargando /></div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role={roleVista} titulo="Perfil">
        <div className={s.wrapper}><ApiState error={error} onReintentar={recargar} /></div>
      </DashboardLayout>
    )
  }

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

  const rolLabel = `${ROL_LABEL[companero.rol] || companero.rol} SENA`

  return (
    <DashboardLayout role={roleVista} titulo="Perfil">
      <div className={s.wrapper}>
        <PerfilBase
          user={companero}
          role={companero.rol}
          soloLectura
          titulo={nombreCompleto(companero, companero?.correo || 'Usuario')}
          subtitulo={esAprendiz ? 'Perfil de aprendiz' : 'Perfil de instructor'}
          breadcrumb={[
            { label: 'Dashboard', to: `${base}/dashboard` },
            ...(ficha && esAprendiz
              ? [{ label: 'Mi Ficha', to: `${base}/detalle-ficha/${ficha.id}` }]
              : []),
            { label: nombreCompleto(companero, companero?.correo || 'Usuario') },
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
          <DataPanel title={`Propuestas de ${nombreCompleto(companero, companero?.correo || 'Usuario').split(' ')[0]} (${proyectosUsuario.length})`} icon={<FolderOpen />}>
            {proyectosUsuario.length === 0 ? (
              <p className={s.muted}>Este aprendiz aún no ha registrado propuestas.</p>
            ) : (
              <ul className={s.list}>
                {proyectosUsuario.map((p) => {
                  const pct = similitudMax(p.id)
                  return (
                    <li key={p.id}>
                      <Link to={`${base}/detalle-proyecto/${p.id}`} viewTransition className={s.row}>
                        <span className={s.rowInfo}>
                          <span className={s.rowTitle}>{p.titulo}</span>
                          <span className={s.rowMeta}><CalendarBlank size={14} /> {formatearFecha(p.created_at)}</span>
                        </span>
                        <span className={s.rowSide}>
                          {pct != null && <GradeBadge score={pct} size="sm" />}
                          <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>
                            {ESTADO_LABEL[p.estado] || p.estado}
                          </Badge>
                        </span>
                      </Link>
                    </li>
                  )
                })}
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


