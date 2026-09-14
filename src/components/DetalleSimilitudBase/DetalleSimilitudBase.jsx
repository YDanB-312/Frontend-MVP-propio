import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarBlank, FileText, MagnifyingGlass, User } from 'phosphor-react'
import PageHeader from '../PageHeader/PageHeader'
import DataPanel from '../DataPanel/DataPanel'
import Badge from '../Badge/Badge'
import GradeBadge from '../GradeBadge/GradeBadge'
import ScoreDial from '../ScoreDial/ScoreDial'
import Tag from '../Tag/Tag'
import EmptyState from '../EmptyState/EmptyState'
import { useAuth } from '../../contexts/AuthContext'
import { findProjectById, findFichaById, getSimilitudesValidas, getFichasDelInstructor, displayNames } from '../../data/mockData'
import s from './DetalleSimilitudBase.module.css'

const ESTADO_PROYECTO_VARIANT = (estado) =>
  estado === 'aprobado' ? 'success' : estado === 'rechazado' ? 'danger' : estado === 'pendiente' ? 'warning' : 'neutral'

const RUTA_POR_ROL = {
  aprendiz: { volver: '/aprendiz/propuestas', label: 'Mis Propuestas' },
  instructor: { volver: '/instructor/dashboard', label: 'Dashboard' },
  admin: { volver: '/admin/similitudes', label: 'Similitudes' },
}

export default function DetalleSimilitudBase({
  similitud,
  role = 'aprendiz',
  projectPath = '/detalle-proyecto',
  actions = null,
  children = null,
  backTo,
  backLabel,
}) {
  const navigate = useNavigate()
  const ruta = RUTA_POR_ROL[role] || RUTA_POR_ROL.aprendiz
  const { user } = useAuth()
  const esInstructor = role === 'instructor'
  const { misFichasIds, misProgramas } = useMemo(() => {
    if (!esInstructor || !user?.id) return { misFichasIds: null, misProgramas: null }
    const fichas = getFichasDelInstructor(Number(user?.id))
    return {
      misFichasIds: new Set(fichas.map((f) => f.id)),
      misProgramas: new Set(fichas.map((f) => f.programa).filter(Boolean)),
    }
  }, [esInstructor, user?.id])

  const proyecto1 = useMemo(() => (similitud ? findProjectById(similitud.projectId1) : null), [similitud])
  const proyecto2 = useMemo(() => (similitud ? findProjectById(similitud.projectId2) : null), [similitud])

  const otras = useMemo(() => {
    if (!similitud) return []
    const idA = proyecto1?.id
    const idB = proyecto2?.id
    const vistas = new Map()
    for (const x of getSimilitudesValidas()) {
      if (x.id === similitud.id) continue
      let origen = null
      let otroPid = null
      if (x.projectId1 === idA || x.projectId2 === idA) {
        origen = 'A'
        otroPid = x.projectId1 === idA ? x.projectId2 : x.projectId1
      } else if (x.projectId1 === idB || x.projectId2 === idB) {
        origen = 'B'
        otroPid = x.projectId1 === idB ? x.projectId2 : x.projectId1
      }
      if (!origen || vistas.has(x.id)) continue
      // Intructor: solo otras coincidencias de su programa (consistencia intra-programa)
      if (esInstructor && misProgramas) {
        const otroProy = findProjectById(otroPid)
        const progOtro = otroProy ? findFichaById(Number(otroProy.fichaId))?.programa : null
        const enFicha = otroProy ? misFichasIds.has(Number(otroProy.fichaId)) : false
        const enPrograma = progOtro ? misProgramas.has(progOtro) : false
        if (!enFicha && !enPrograma) continue
      }
      vistas.set(x.id, { ...x, origen, otroPid })
    }
    return [...vistas.values()].sort((a, b) => b.similitud - a.similitud)
  }, [similitud, proyecto1, proyecto2, esInstructor, misFichasIds, misProgramas])

  // Guard instructor (opción 1): bloquear si el par no es de su programa/fichas (hooks antes de returns)
  const noAutorizado = useMemo(() => {
    if (!esInstructor || !similitud || !misProgramas || !proyecto1 || !proyecto2) return false
    const prog1 = findFichaById(Number(proyecto1.fichaId))?.programa
    const prog2 = findFichaById(Number(proyecto2.fichaId))?.programa
    const enFicha = misFichasIds.has(Number(proyecto1.fichaId)) || misFichasIds.has(Number(proyecto2.fichaId))
    const enPrograma = (prog1 && misProgramas.has(prog1)) || (prog2 && misProgramas.has(prog2))
    return !enFicha && !enPrograma
  }, [esInstructor, similitud, misProgramas, misFichasIds, proyecto1, proyecto2])

  if (!similitud) {
    return (
      <EmptyState
        icon={<MagnifyingGlass />}
        title="Similitud no encontrada"
        message="El análisis de similitud que buscas no existe o fue eliminado."
        actionLabel={`Volver a ${ruta.label.toLowerCase()}`}
        onAction={() => navigate(ruta.volver)}
      />
    )
  }

  if (noAutorizado) {
    return (
      <EmptyState
        icon={<MagnifyingGlass />}
        title="Similitud no autorizada"
        message="No tienes acceso a esta similitud porque no pertenece a tu programa. Solo puedes ver similitudes de propuestas del mismo programa que tus fichas."
        actionLabel={`Volver a ${ruta.label.toLowerCase()}`}
        onAction={() => navigate(ruta.volver)}
      />
    )
  }

  const pct = Math.round((similitud.similitud || 0) * 100)
  const proyectos = [
    { p: proyecto1, tag: 'A' },
    { p: proyecto2, tag: 'B' },
  ]

  // Ver proyecto: propio de la ficha o mismo programa exacto (ADSO solo con ADSO, etc.)
  // Las similitudes solo se forman intra-programa, por lo que un par de otra ficha
  // con el mismo programa debe ser visible aunque no esté a cargo del instructor.
  function puedeVerProyecto(pid) {
    if (!esInstructor || !misFichasIds) return true
    const proyecto = findProjectById(pid)
    if (!proyecto) return false
    const fichaId = Number(proyecto.fichaId)
    if (misFichasIds.has(fichaId)) return true
    const programa = findFichaById(fichaId)?.programa
    return programa != null && misProgramas.has(programa)
  }

  const crumbPrevio =
    role === 'admin'
      ? [
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Similitudes', to: '/admin/similitudes' },
        ]
      : [{ label: ruta.label, to: ruta.volver }]

  return (
    <div className={s.wrapper}>
      <PageHeader
        title={`Similitud #${similitud.id}`}
        subtitle={`Detectada el ${similitud.createdAt} · ${similitud.project1Student} vs. ${similitud.project2Student}`}
        icon={<MagnifyingGlass />}
        breadcrumb={[...crumbPrevio, { label: `#${similitud.id}` }]}
      />

      <section className={s.score}>
        <ScoreDial value={pct} size={120} label="Índice de similitud" />
        <div className={s.scoreInfo}>
          <p className={s.scoreLabel}>Índice de similitud</p>
          <GradeBadge score={pct} />
        </div>
      </section>

      <div className={s.grid}>
        {proyectos.map(({ p, tag }) => (
          <DataPanel key={tag} title={`Propuesta ${tag}`} icon={<FileText />}>
            {p ? (
              <div className={s.projectCard}>
                <h3 className={s.projectTitle}>{p.title}</h3>
                <p className={s.projectMeta}>
                  <User size={14} /> {p.studentName}
                </p>
                <p className={s.projectMeta}>
                  <CalendarBlank size={14} /> {p.createdAt}
                </p>
                <p className={s.projectDesc}>{p.description}</p>
                <Badge variant={ESTADO_PROYECTO_VARIANT(p.estado)}>
                  {displayNames.projectStatus[p.estado] || p.estado}
                </Badge>
                {puedeVerProyecto(p.id) ? (
                  <Link to={`/${role}${projectPath}/${p.id}`} className={s.link}>
                    Ver proyecto <ArrowRight size={14} />
                  </Link>
                ) : (
                  <span className={s.muted}>Propuesta de otra ficha</span>
                )}
              </div>
            ) : (
              <p className={s.muted}>Este proyecto ya no está disponible.</p>
            )}
          </DataPanel>
        ))}
      </div>

      {otras.length > 0 && (
        <DataPanel title={`Otras coincidencias relacionadas (${otras.length})`} icon={<MagnifyingGlass />}>
          <ul className={s.otrasList}>
            {otras.map((x) => {
              const pctX = Math.round((x.similitud || 0) * 100)
              const otro = findProjectById(x.otroPid)
              return (
                <li key={x.id}>
                  <Link to={`/${role}/detalle-similitud/${x.id}`} className={s.otrasRow}>
                    <Tag variant={x.origen === 'A' ? 'a' : 'b'}>
                      Proyecto {x.origen}
                    </Tag>
                    <span className={s.otrasInfo}>
                      <span className={s.otrasTitle}>{otro?.title || 'Proyecto no disponible'}</span>
                      <span className={s.otrasMeta}>
                        <User size={12} /> {otro?.studentName}
                      </span>
                    </span>
                    <GradeBadge score={pctX} size="sm" />
                    <ArrowRight size={14} className={s.otrasChevron} />
                  </Link>
                </li>
              )
            })}
          </ul>
        </DataPanel>
      )}

      {actions}
      {children}

      {backTo && (
        <div className={s.backRow}>
          <Link to={backTo} className={s.backLink}>
            <ArrowLeft size={14} /> {backLabel || 'Volver'}
          </Link>
        </div>
      )}
    </div>
  )
}
