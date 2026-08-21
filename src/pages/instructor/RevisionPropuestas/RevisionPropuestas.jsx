import { useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import Avatar from '../../../components/Avatar/Avatar'
import { useAuth } from '../../../contexts/AuthContext'
import {
  getProjectsByInstructor,
  getAllSimilarities,
  updateProjectEstado,
  createNotification,
  displayNames,
} from '../../../data/mockData'
import s from './RevisionPropuestas.module.css'
import { CheckCircle, ClipboardText, MagnifyingGlass, Tray, XCircle } from 'phosphor-react'

const ITEMS_POR_PAGINA = 8

const ESTADO_VARIANT = {
  pendiente: 'warning',
  en_revision: 'info',
  aprobado: 'success',
  rechazado: 'danger',
  requiere_ajustes: 'warning',
}

function similitudInfo(similitudes, projectId) {
  const propias = similitudes.filter((x) => x.projectId1 === projectId || x.projectId2 === projectId)
  if (propias.length === 0) return null
  return {
    pct: Math.max(...propias.map((x) => Math.round(x.similitud * 100))),
    count: propias.length,
  }
}

export default function RevisionPropuestas() {
  const { user } = useAuth()
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [modal, setModal] = useState(null)

  const proyectos = user ? getProjectsByInstructor(Number(user.id)) : []
  const similitudes = getAllSimilarities()

  const filtrados =
    filtroEstado === 'todos'
      ? proyectos
      : proyectos.filter((p) => p.estado === filtroEstado)

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

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

        <FilterBar title="Filtros de estado">
          <label className={s.filterField}>
            <span className={s.filterLabel}>Estado</span>
            <select
              className={s.select}
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value)
                setPagina(1)
              }}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En Revisión</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="requiere_ajustes">Requiere Ajustes</option>
            </select>
          </label>
          <p className={s.filterInfo}>
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
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Aprendiz</th>
                    <th>Similitud</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th className={s.colActions}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((p) => {
                    const info = similitudInfo(similitudes, p.id)
                    return (
                    <tr key={p.id}>
                      <td>
                        <Link to={`/instructor/detalle-proyecto/${p.id}`} className={s.titleLink}>
                          {p.title}
                        </Link>
                        <span className={s.subText}>{p.fichaId ? `Ficha #${p.fichaId}` : ''}</span>
                      </td>
                      <td>
                        <span className={s.student}>
                          <Avatar name={p.studentName} size="sm" />
                          {p.studentName}
                        </span>
                      </td>
                      <td>
                        {info ? (
                          <Badge variant={info.pct >= 70 ? 'danger' : info.pct >= 40 ? 'warning' : 'success'}>
                            <MagnifyingGlass size={12} /> {info.pct}% · {info.count}
                          </Badge>
                        ) : (
                          <span className={s.muted}>—</span>
                        )}
                      </td>
                      <td className={s.date}>{p.createdAt}</td>
                      <td>
                        <Badge variant={ESTADO_VARIANT[p.estado] || 'neutral'}>
                          {displayNames.projectStatus[p.estado] || p.estado}
                        </Badge>
                      </td>
                      <td className={s.colActions}>
                        <div className={s.actions}>
                          {p.estado === 'pendiente' ? (
                            <>
                              <button
                                type="button"
                                className={`${s.btn} ${s.success}`}
                                onClick={() => abrirModal(p, 'aprobado')}
                              >
                                <CheckCircle size={14} /> Aprobar
                              </button>
                              <button
                                type="button"
                                className={`${s.btn} ${s.danger}`}
                                onClick={() => abrirModal(p, 'rechazado')}
                              >
                                <XCircle size={14} /> Rechazar
                              </button>
                            </>
                          ) : (
                            <Link
                              to={`/instructor/detalle-proyecto/${p.id}`}
                              className={`${s.btn} ${s.secondary}`}
                            >
                              Ver detalle
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
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
