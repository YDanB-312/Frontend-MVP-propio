import { useRef, useState } from 'react'
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
import { useAuth } from '../../../contexts/AuthContext'
import {
  getAllProjects,
  getAllFichas,
  getSimilitudesValidas,
  getSimilaritiesByProject,
  findFichaById,
  updateProjectEstado,
  createNotification,
  displayNames,
} from '../../../data/mockData'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import s from '../../../components/ListaBase/ListaBase.module.css'
import { getSimilitudInfo as similitudInfo } from '../../../utils/similitudInfo'
import local from './RevisionPropuestas.module.css'
import { ArrowRight, CheckCircle, ClipboardText, Tray, XCircle } from 'phosphor-react'
import { PAGINA_TABLA } from '../../../constants/pagination'

const ITEMS_POR_PAGINA = PAGINA_TABLA

export default function RevisionPropuestas() {
  const { user } = useAuth()
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [modal, setModal] = useState(null)
  const [msgAprobacion, setMsgAprobacion] = useState(null)
  const [selId, setSelId] = useState(null)
  const msgTimer = useRef(null)

  // Solo propuestas de fichas a su cargo
  const idsMisFichas = new Set(
    (user ? getAllFichas().filter((f) => f.instructorId === Number(user.id)) : []).map((f) => f.id)
  )
  const proyectos = getAllProjects().filter((p) => idsMisFichas.has(p.fichaId))
  const similitudes = getSimilitudesValidas()

  const filtrados =
    filtroEstado === 'todos'
      ? proyectos
      : proyectos.filter((p) => p.estado === filtroEstado)

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const seleccionada = paginados.find((p) => p.id === selId) || paginados[0] || null
  const simsSel = seleccionada ? getSimilaritiesByProject(seleccionada.id) : []
  const infoSel = seleccionada ? similitudInfo(similitudes, seleccionada.id) : null
  const fichaSel = seleccionada?.fichaId ? findFichaById(seleccionada.fichaId) : null

  const abrirModal = (proyecto, accion) => setModal({ proyecto, accion })

  const confirmarAccion = () => {
    if (!modal) return
    const { proyecto, accion } = modal
    updateProjectEstado(proyecto.id, accion)
    createNotification({
      mensaje:
        accion === 'aprobado'
          ? `Tu proyecto '${proyecto.title}' ha sido Aprobado`
          : `Tu proyecto '${proyecto.title}' ha sido Rechazado`,
      tipo: 'revision',
      userId: proyecto.studentId,
      projectId: proyecto.id,
    })
    if (accion === 'aprobado') {
      // Total acumulado (no solo las nuevas): la detección ya pudo correr al subir la propuesta
      const total = getSimilaritiesByProject(proyecto.id).length
      setMsgAprobacion(
        total > 0
          ? `Propuesta aprobada · se detectaron ${total} coincidencia(s) con propuestas anteriores.`
          : "Propuesta aprobada · sin coincidencias con propuestas anteriores."
      )
      if (msgTimer.current) clearTimeout(msgTimer.current)
      msgTimer.current = setTimeout(() => setMsgAprobacion(null), 6000)
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
          <p className={s.info}>
            {filtrados.length} propuesta{filtrados.length !== 1 ? 's' : ''} encontrada
            {filtrados.length !== 1 ? 's' : ''}
          </p>
        </FilterBar>

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
                  const info = similitudInfo(similitudes, p.id)
                  const activo = seleccionada?.id === p.id
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
                          <span className={local.nodoTitulo}>{p.title}</span>
                          <span className={local.nodoMeta}>
                            <Avatar name={p.studentName} size="sm" />
                            {p.studentName} · {p.createdAt}
                          </span>
                        </span>
                        <span className={local.nodoLado}>
                          {info ? <GradeBadge score={info.pct} size="sm" /> : null}
                          <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>
                            {displayNames.projectStatus[p.estado] || p.estado}
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
                  aria-label={`Vista previa: ${seleccionada.title}`}
                >
                  <p className={`mono ${local.kicker}`}>
                    {displayNames.projectStatus[seleccionada.estado] || seleccionada.estado} · {seleccionada.createdAt}
                  </p>
                  <h2 className={local.previewTitulo}>{seleccionada.title}</h2>
                  <p className={local.previewMeta}>
                    {seleccionada.studentName}
                    {fichaSel ? ` · ${fichaSel.codigo} · ${fichaSel.nombre}` : ' · Sin ficha'}
                  </p>
                  <p className={local.previewDesc}>{seleccionada.description}</p>
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
                          aria-label={`Aprobar ${seleccionada.title}`}
                          onClick={() => abrirModal(seleccionada, 'aprobado')}
                        >
                          <CheckCircle size={14} /> Aprobar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="dangerGhost"
                          aria-label={`Rechazar ${seleccionada.title}`}
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
      </div>

      <ConfirmModal
        open={!!modal}
        titulo={modal?.accion === 'aprobado' ? 'Aprobar propuesta' : 'Rechazar propuesta'}
        mensaje={
          modal
            ? `¿Seguro que deseas ${
                modal.accion === 'aprobado' ? 'aprobar' : 'rechazar'
              } la propuesta "${modal.proyecto.title}"? El aprendiz será notificado.`
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
