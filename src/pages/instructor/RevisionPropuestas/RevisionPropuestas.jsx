import { useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import { Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import Avatar from '../../../components/Avatar/Avatar'
import { useAuth } from '../../../contexts/AuthContext'
import {
  getProjectsByInstructor,
  getAllProjects,
  getAllFichas,
  getAllSimilarities,
  getSimilitudesValidas,
  findUserById,
  findFichaById,
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
            <Select
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
            </Select>
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
                    <th>Propuesta</th>
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
                    const est = findUserById(p.studentId)
                    const fic = p.fichaId ? findFichaById(p.fichaId) : null
                    return (
                    <tr key={p.id}>
                      <td data-label="Propuesta">
                        <Link to={`/instructor/detalle-proyecto/${p.id}`} className={s.titleLink}>
                          {p.title}
                        </Link>
                        <span className={s.subText}>{fic ? `${fic.codigo} · ${fic.nombre}` : 'Sin ficha'}</span>
                      </td>
                      <td data-label="Aprendiz">
                        <span className={s.student}>
                          <Avatar name={p.studentName} src={est?.fotoPerfil} size="sm" />
                          {p.studentName}
                        </span>
                      </td>
                      <td data-label="Similitud">
                        {info ? (
                          <Badge variant={info.pct >= 70 ? 'danger' : info.pct >= 40 ? 'warning' : 'success'}>
                            <MagnifyingGlass size={12} /> {info.pct}% · {info.count}
                          </Badge>
                        ) : (
                          <span className={s.muted}>—</span>
                        )}
                      </td>
                      <td data-label="Fecha" className={s.date}>{p.createdAt}</td>
                      <td data-label="Estado">
                        <Badge variant={ESTADO_VARIANT[p.estado] || 'neutral'}>
                          {displayNames.projectStatus[p.estado] || p.estado}
                        </Badge>
                      </td>
                      <td data-label="Acciones" className={s.colActions}>
                        <div className={s.actions}>
                          {p.estado === 'pendiente' ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="success"
                                onClick={() => abrirModal(p, 'aprobado')}
                              >
                                <CheckCircle size={14} /> Aprobar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="danger"
                                onClick={() => abrirModal(p, 'rechazado')}
                              >
                                <XCircle size={14} /> Rechazar
                              </Button>
                            </>
                          ) : (
                            <Button
                              as="link"
                              to={`/instructor/detalle-proyecto/${p.id}`}
                              size="sm"
                              variant="secondary"
                            >
                              Ver detalle
                            </Button>
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
