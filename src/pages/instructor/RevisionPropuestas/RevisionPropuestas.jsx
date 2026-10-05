import { useEffect, useMemo, useRef, useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import StatusMark from '../../../components/StatusMark/StatusMark'
import { PROPUESTA_STATUS } from '../../../constants/estadoStatus'
import Button from '../../../components/Button/Button'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import ConsoleCard from '../../../components/ConsoleCard/ConsoleCard'
import { Input, Select, Textarea } from '../../../components/Input/Input'
import FormField from '../../../components/FormField/FormField'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import Avatar from '../../../components/Avatar/Avatar'
import Alert from '../../../components/Alert/Alert'
import ApiState from '../../../components/ApiState/ApiState'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { proyectos, similitudes as similitudesApi, fichas, instructores, INCLUDE_PROYECTOS } from '../../../lib/recursos'
import { fechaDesdeApi, norm, nombreCompleto, infoSimilitud } from '../../../utils/helpers'
import s from '../../../components/ListaBase/ListaBase.module.css'
import local from './RevisionPropuestas.module.css'
import { ArrowRight, CheckCircle, ClipboardText, Tray, XCircle } from 'phosphor-react'
import { PAGINA_TABLA } from '../../../constants/pagination'
import { PROJECT_ESTADO_LABEL as ESTADO_LABEL } from '../../../constants/badgeVariants'

const ITEMS_POR_PAGINA = PAGINA_TABLA

// Relaciones necesarias para mostrar creador y ficha en la cola de revisión.



// Máximo porcentaje y conteo de coincidencias de una propuesta.

export default function RevisionPropuestas() {
  const { user } = useAuth()
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroFicha, setFiltroFicha] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [modal, setModal] = useState(null)
  // Observación opcional del rechazo (se guarda en comments y viaja al aprendiz).
  const [observacion, setObservacion] = useState('')
  const [msgAprobacion, setMsgAprobacion] = useState(null)
  const [selId, setSelId] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')
  const msgTimer = useRef(null)

  // Limpia el temporizador del aviso si se sale de la pantalla.
  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current) }, [])

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
      (p) => p.estado !== 'borrador'
        && (Number(p.id_instructor_asignado) === Number(miFila?.id) || misFichasIds.has(Number(p.id_class_group)))
    ),
    [todosProyectos, miFila?.id, misFichasIds]
  )

  const filtrados = useMemo(() => {
    let lista = proyectosMios
    if (filtroEstado !== 'todos') lista = lista.filter((p) => p.estado === filtroEstado)
    if (filtroFicha === 'sin-ficha') lista = lista.filter((p) => !p.id_class_group)
    else if (filtroFicha !== 'todos') lista = lista.filter((p) => String(p.id_class_group) === String(filtroFicha))
    const q = norm(busqueda.trim())
    if (q) {
      lista = lista.filter((p) =>
        norm(p.titulo).includes(q) ||
        norm(nombreCompleto(p.creator)).includes(q) ||
        norm(p.classGroup?.codigo).includes(q) ||
        norm(p.classGroup?.numero).includes(q)
      )
    }
    return lista
  }, [proyectosMios, filtroEstado, filtroFicha, busqueda])

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const seleccionada = paginados.find((p) => p.id === selId) || paginados[0] || null

  // Similitudes de la propuesta seleccionada (la contraparte debe estar
  // aprobada). Así una propuesta pendiente muestra sus coincidencias al revisar.
  const { data: simsProyecto, setData: setSimsProyecto } = useApi(
    () => (seleccionada ? similitudesApi.listar({ proyecto_id: seleccionada.id }) : Promise.resolve([])),
    [seleccionada?.id],
    { inicial: [] }
  )
  const simsSel = simsProyecto || []
  const infoSel = seleccionada ? infoSimilitud(simsProyecto || [], seleccionada.id) : null
  const fichaSel = seleccionada?.classGroup || null

  const abrirModal = (proyecto, accion) => {
    setObservacion('')
    setModal({ proyecto, accion })
  }

  const confirmarAccion = async () => {
    if (!modal) return
    const { proyecto, accion } = modal
    setErrorAccion('')
    try {
      // 1) Actualiza el estado (el rechazo puede llevar una observación opcional).
      // El backend registra el historial y notifica al creador.
      await proyectos.actualizar(proyecto.id, {
        ...proyecto,
        estado: accion,
        observacion: accion === 'rechazado' ? (observacion.trim() || undefined) : undefined,
      })

      // 2) El motor ya corrió al enviar la propuesta: al aprobar solo se
      // confirman las coincidencias detectadas (no se repite el análisis).
      if (accion === 'aprobado') {
        try {
          // Una sola consulta: el motor ya corrió al enviar la propuesta.
          const lista = await similitudesApi.listar({ proyecto_id: proyecto.id })
          setSimsProyecto(lista)
          const total = lista.length
          setMsgAprobacion(
            total > 0
              ? `Propuesta aprobada · se detectaron ${total} coincidencia(s) con propuestas anteriores.`
              : 'Propuesta aprobada · sin coincidencias con propuestas anteriores.'
          )
          if (msgTimer.current) clearTimeout(msgTimer.current)
          msgTimer.current = setTimeout(() => setMsgAprobacion(null), 6000)
        } catch {
          setMsgAprobacion('Propuesta aprobada. No se pudo cargar el resumen de coincidencias; puedes verlo en Similitudes.')
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

        {miFila && (
          <Alert variant="info">
            <ClipboardText size={14} /> Revisa cada propuesta y decide con base en el análisis de similitud.
          </Alert>
        )}

        <FilterBar title="Filtros de estado">
          <label className={s.field}>
            <span className={s.label}>Buscar</span>
            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPagina(1)
                setSelId(null)
              }}
              placeholder="Título, aprendiz o ficha…"
            />
          </label>
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
              {['pendiente', 'aprobado', 'rechazado'].map((valor) => (
                <option key={valor} value={valor}>{ESTADO_LABEL[valor]}</option>
              ))}
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
                            <StatusMark status={PROPUESTA_STATUS[p.estado] || 'pending'} label={ESTADO_LABEL[p.estado] || p.estado} />
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
      >
        {modal?.accion === 'rechazado' && (
          <FormField
            label="Observación (opcional)"
            help="Si la escribes, se guarda en el proyecto y el aprendiz la recibe en la notificación."
          >
            <Textarea
              rows={3}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              maxLength={1000}
              placeholder="Ej: falta definir el diferencial del proyecto."
            />
          </FormField>
        )}
      </ConfirmModal>
    </DashboardLayout>
  )
}
