import { useMemo, useRef, useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import ConsoleCard from '../../../components/ConsoleCard/ConsoleCard'
import { Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import Avatar from '../../../components/Avatar/Avatar'
import Alert from '../../../components/Alert/Alert'
import ApiState from '../../../components/ApiState/ApiState'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { proyectos, similitudes as similitudesApi, notificaciones, fichas, instructores } from '../../../lib/recursos'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import { fechaDesdeApi } from '../../../utils/helpers'
import s from '../../../components/ListaBase/ListaBase.module.css'
import local from './RevisionPropuestas.module.css'
import { ArrowRight, CheckCircle, ClipboardText, Tray, XCircle } from 'phosphor-react'
import { PAGINA_TABLA } from '../../../constants/pagination'

const ITEMS_POR_PAGINA = PAGINA_TABLA

// Relaciones necesarias para mostrar creador y ficha en la cola de revisión.
const INCLUDE_PROYECTOS = 'creator,instructor.generalUser,classGroup.program,classGroup.trainingCenter,apprentices.generalUser'

const ESTADO_LABEL = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

// Máximo porcentaje y conteo de coincidencias de una propuesta.
function infoSimilitud(lista, projectId) {
  const pares = (lista || []).filter(
    (x) => Number(x.id_proyecto_1) === Number(projectId) || Number(x.id_proyecto_2) === Number(projectId)
  )
  if (pares.length === 0) return null
  return {
    pct: Math.max(...pares.map((x) => Math.round(Number(x.porcentaje) || 0))),
    count: pares.length,
  }
}

export default function RevisionPropuestas() {
  const { user } = useAuth()
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroFicha, setFiltroFicha] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [modal, setModal] = useState(null)
  const [msgAprobacion, setMsgAprobacion] = useState(null)
  const [selId, setSelId] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')
  const msgTimer = useRef(null)

  // Propuestas (alcance), similitudes y catálogos del instructor: fuente única la API.
  const { data: instructoresApi } = useApi(() => instructores.listar(), [], { inicial: [] })
  const { data: fichasApi } = useApi(() => fichas.listar(), [], { inicial: [] })
  const { data: todosProyectos, cargando, error, recargar: recargarProyectos } = useApi(
    () => proyectos.listar({ included: INCLUDE_PROYECTOS }),
    [],
    { inicial: [] }
  )
  // Lista global (solo pares con ambas aprobadas): para el % por tarjeta.
  const { data: similitudes } = useApi(
    () => similitudesApi.listar(),
    [],
    { inicial: [] }
  )

  // Fila de perfil del instructor y fichas a su cargo.
  const miFila = useMemo(
    () => instructoresApi.find((i) => Number(i.id_usuario) === Number(user?.id)) || null,
    [instructoresApi, user?.id]
  )
  const misFichasIds = useMemo(
    () => new Set(fichasApi
      .filter((f) => Number(f.instructor?.id) === Number(miFila?.id))
      .map((f) => Number(f.id))),
    [fichasApi, miFila?.id]
  )
  const misFichas = useMemo(
    () => fichasApi.filter((f) => Number(f.instructor?.id) === Number(miFila?.id)),
    [fichasApi, miFila?.id]
  )

  // Regla de negocio: proyecto propio asignado O de una ficha a cargo.
  const proyectosMios = useMemo(
    () => todosProyectos.filter(
      (p) => Number(p.id_instructor_asignado) === Number(miFila?.id) || misFichasIds.has(Number(p.id_class_group))
    ),
    [todosProyectos, miFila?.id, misFichasIds]
  )

  const filtrados = useMemo(() => {
    let lista = proyectosMios
    if (filtroEstado !== 'todos') lista = lista.filter((p) => p.estado === filtroEstado)
    if (filtroFicha === 'sin-ficha') lista = lista.filter((p) => !p.id_class_group)
    else if (filtroFicha !== 'todos') lista = lista.filter((p) => String(p.id_class_group) === String(filtroFicha))
    return lista
  }, [proyectosMios, filtroEstado, filtroFicha])

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const seleccionada = paginados.find((p) => p.id === selId) || paginados[0] || null

  // Similitudes de la propuesta seleccionada (la contraparte debe estar
  // aprobada). Así una propuesta pendiente muestra sus coincidencias al revisar.
  const { data: simsProyecto, recargar: recargarSimsProyecto } = useApi(
    () => (seleccionada ? similitudesApi.listar({ proyecto_id: seleccionada.id }) : Promise.resolve([])),
    [seleccionada?.id],
    { inicial: [] }
  )
  const simsSel = simsProyecto || []
  const infoSel = seleccionada ? infoSimilitud(simsProyecto || [], seleccionada.id) : null
  const fichaSel = seleccionada?.classGroup || null

  const abrirModal = (proyecto, accion) => setModal({ proyecto, accion })

  const confirmarAccion = async () => {
    if (!modal) return
    const { proyecto, accion } = modal
    setErrorAccion('')
    try {
      // 1) Actualiza el estado (PUT exige el objeto completo).
      await proyectos.actualizar(proyecto.id, { ...proyecto, estado: accion })

      // 2) Notifica al creador de la propuesta.
      await notificaciones.crear({
        titulo: accion === 'aprobado'
          ? `Tu proyecto '${proyecto.titulo}' ha sido Aprobado`
          : `Tu proyecto '${proyecto.titulo}' ha sido Rechazado`,
        tipo: 'revision',
        enlace: `proyecto:${proyecto.id}`,
        fecha: new Date().toISOString(),
        id_usuario: proyecto.id_creador,
      })

      // 3) Al aprobar, el motor del backend calcula las coincidencias.
      if (accion === 'aprobado') {
        try {
          await similitudesApi.detectar(proyecto.id)
        } catch {
          // El análisis puede recalcularse después; no impide continuar.
        }
        try {
          const lista = await similitudesApi.listar({ proyecto_id: proyecto.id })
          await recargarSimsProyecto()
          const total = lista.length
          setMsgAprobacion(
            total > 0
              ? `Propuesta aprobada · se detectaron ${total} coincidencia(s) con propuestas anteriores.`
              : 'Propuesta aprobada · sin coincidencias con propuestas anteriores.'
          )
          if (msgTimer.current) clearTimeout(msgTimer.current)
          msgTimer.current = setTimeout(() => setMsgAprobacion(null), 6000)
        } catch {
          setMsgAprobacion('Propuesta aprobada · el análisis de similitud se procesará en segundo plano.')
        }
      }

      await recargarProyectos()
    } catch (err) {
      setErrorAccion(err?.data?.message || 'No se pudo actualizar la propuesta. Intenta de nuevo.')
    }
    setModal(null)
  }

  return (
    <DashboardLayout role="instructor" titulo="Revision Propuestas">
      <div className={s.page}>
        <PageHeader
          title="Revisión de Propuestas"
          subtitle="Aprueba o rechaza las propuestas de proyecto enviadas por tus aprendices."
          icon={<ClipboardText />}
        />

        {errorAccion && <Alert variant="danger">{errorAccion}</Alert>}

        {msgAprobacion && (
          <Alert variant={msgAprobacion.includes('sin coincidencias') ? 'success' : 'info'}>
            {msgAprobacion}
          </Alert>
        )}

        <FilterBar title="Filtros de estado">
          <label className={s.field}>
            <span className={s.label}>Estado</span>
            <Select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value)
                setPagina(1)
                setSelId(null)
              }}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </Select>
          </label>
          <label className={s.field}>
            <span className={s.label}>Ficha</span>
            <Select
              value={filtroFicha}
              onChange={(e) => {
                setFiltroFicha(e.target.value)
                setPagina(1)
                setSelId(null)
              }}
            >
              <option value="todos">Todas</option>
              {misFichas.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.codigo} · {f.nombre}
                </option>
              ))}
              <option value="sin-ficha">Sin ficha</option>
            </Select>
          </label>
          <p className={s.info}>
            {filtrados.length} propuesta{filtrados.length !== 1 ? 's' : ''} encontrada
            {filtrados.length !== 1 ? 's' : ''}
          </p>
        </FilterBar>

        <ApiState cargando={cargando} error={error} onReintentar={recargarProyectos}>
          {paginados.length === 0 ? (
            <EmptyState
              icon={<Tray />}
              title="Sin propuestas"
              message={
                filtroEstado === 'todos'
                  ? 'Todavía no has recibido propuestas de proyecto.'
                  : 'No hay propuestas con el estado seleccionado. Prueba con otro filtro.'
              }
            />
          ) : (
            <>
              <div className={local.split}>
                <ol className={local.cola} aria-label="Cola de revisión">
                  {paginados.map((p) => {
                    const info = infoSimilitud(similitudes, p.id)
                    const activo = seleccionada?.id === p.id
                    const autor = nombreCompleto(p.creator) || 'Aprendiz'
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={`${local.nodo} ${activo ? local.nodoActivo : ''}`}
                          aria-current={activo ? 'true' : undefined}
                          onClick={() => setSelId(p.id)}
                        >
                          <span className={`${local.dot} ${local[`dot-${p.estado}`]}`} aria-hidden="true" />
                          <span className={local.nodoMain}>
                            <span className={local.nodoTitulo}>{p.titulo}</span>
                            <span className={local.nodoMeta}>
                              <Avatar name={autor} size="sm" />
                              {autor} · {fechaDesdeApi(p.created_at)}
                            </span>
                          </span>
                          <span className={local.nodoLado}>
                            {info ? <GradeBadge score={info.pct} size="sm" /> : null}
                            <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>
                              {ESTADO_LABEL[p.estado] || p.estado}
                            </Badge>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ol>

                {seleccionada && (
                  <ConsoleCard
                    className={local.preview}
                    glow={seleccionada.estado === 'pendiente'}
                    aria-label={`Vista previa: ${seleccionada.titulo}`}
                  >
                    <p className={`mono ${local.kicker}`}>
                      {ESTADO_LABEL[seleccionada.estado] || seleccionada.estado} · {fechaDesdeApi(seleccionada.created_at)}
                    </p>
                    <h2 className={local.previewTitulo}>{seleccionada.titulo}</h2>
                    <p className={local.previewMeta}>
                      {nombreCompleto(seleccionada.creator) || 'Aprendiz'}
                      {fichaSel ? ` · ${fichaSel.codigo} · ${fichaSel.nombre}` : ' · Sin ficha'}
                    </p>
                    <p className={local.previewDesc}>{seleccionada.resumen}</p>
                    <div className={local.previewSims}>
                      <span className={local.previewLabel}>Similitud máxima</span>
                      {infoSel ? (
                        <GradeBadge score={infoSel.pct} />
                      ) : (
                        <span className={s.muted}>Sin coincidencias</span>
                      )}
                      {simsSel.length > 0 && (
                        <span className={s.muted}>
                          · {simsSel.length} coincidencia{simsSel.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className={local.previewAcciones} aria-live="polite">
                      {seleccionada.estado === 'pendiente' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            aria-label={`Aprobar ${seleccionada.titulo}`}
                            onClick={() => abrirModal(seleccionada, 'aprobado')}
                          >
                            <CheckCircle size={14} /> Aprobar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="dangerGhost"
                            aria-label={`Rechazar ${seleccionada.titulo}`}
                            onClick={() => abrirModal(seleccionada, 'rechazado')}
                          >
                            <XCircle size={14} /> Rechazar
                          </Button>
                        </>
                      ) : null}
                      <Button
                        as="link"
                        to={`/instructor/detalle-proyecto/${seleccionada.id}`}
                        viewTransition
                        size="sm"
                        variant="secondary"
                      >
                        Ver detalle <ArrowRight size={14} />
                      </Button>
                    </div>
                  </ConsoleCard>
                )}
              </div>

              <Pagination
                totalItems={filtrados.length}
                itemsPerPage={ITEMS_POR_PAGINA}
                paginaActual={pagina}
                setPaginaActual={setPagina}
                itemName="propuestas"
                filteredCount={filtrados.length}
              />
            </>
          )}
        </ApiState>
      </div>

      <ConfirmModal
        open={!!modal}
        titulo={modal?.accion === 'aprobado' ? 'Aprobar propuesta' : 'Rechazar propuesta'}
        mensaje={
          modal
            ? `¿Seguro que deseas ${
                modal.accion === 'aprobado' ? 'aprobar' : 'rechazar'
              } la propuesta "${modal.proyecto.titulo}"? El aprendiz será notificado.`
            : ''
        }
        textoConfirmar={modal?.accion === 'aprobado' ? 'Sí, aprobar' : 'Sí, rechazar'}
        textoCancelar="Cancelar"
        onConfirmar={confirmarAccion}
        onCancelar={() => setModal(null)}
      />
    </DashboardLayout>
  )
}
