import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Books, Plus, Eye, Trash } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { useAuth } from '../../../contexts/AuthContext'
import {
  getAllFichas,
  deleteFicha,
  getEstudiantesDeFicha,
  displayNames,
} from '../../../data/mockData'
import s from './GestionarFichas.module.css'

const ITEMS_POR_PAGINA = 8

export default function GestionarFichas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [aEliminar, setAEliminar] = useState(null)

  const fichas = getAllFichas()

  const filtradas = fichas.filter((f) => {
    const q = busqueda.trim().toLowerCase()
    const coincideQ =
      !q ||
      f.nombre.toLowerCase().includes(q) ||
      f.codigo.toLowerCase().includes(q) ||
      (f.programa || '').toLowerCase().includes(q)
    const coincideEstado = filtroEstado === 'todos' || f.estado === filtroEstado
    return coincideQ && coincideEstado
  })

  const paginadas = filtradas.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const confirmarEliminar = () => {
    if (!aEliminar) return
    deleteFicha(aEliminar.id)
    setAEliminar(null)
  }

  return (
    <DashboardLayout role="instructor" titulo="Gestionar Fichas">
      <div className={s.page}>
        <PageHeader
          title="Gestionar Fichas"
          subtitle="Consulta las fichas de formación, revisa sus aprendices y administra su información."
          icon={<Books />}
          actions={
            <Link to="/instructor/crear-ficha" className={`${s.btn} ${s.primary}`}>
              <Plus size={14} /> Crear Ficha
            </Link>
          }
        />

        <FilterBar title="Buscar y filtrar">
          <label className={s.field}>
            <span className={s.label}>Buscar</span>
            <input
              className={s.input}
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPagina(1)
              }}
              placeholder="Nombre, código o programa…"
            />
          </label>
          <label className={s.field}>
            <span className={s.label}>Estado</span>
            <select
              className={s.select}
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value)
                setPagina(1)
              }}
            >
              <option value="todos">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </label>
          <p className={s.info}>
            {filtradas.length} ficha{filtradas.length !== 1 ? 's' : ''}
          </p>
        </FilterBar>

        {paginadas.length === 0 ? (
          <EmptyState
            icon={<Books />}
            title="No hay fichas"
            message={
              fichas.length === 0
                ? 'Aún no se han creado fichas de formación.'
                : 'Ninguna ficha coincide con los filtros aplicados.'
            }
            actionLabel="Crear nueva ficha"
            actionIcon={<Plus size={14} />}
            onAction={() => navigate('/instructor/crear-ficha')}
          />
        ) : (
          <>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Ficha</th>
                    <th>Aprendices</th>
                    <th>Proyectos</th>
                    <th>Estado</th>
                    <th>Creada</th>
                    <th className={s.colActions}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginadas.map((f) => {
                    const esMia = Number(user?.id) === f.instructorId
                    const estudiantes = getEstudiantesDeFicha(f.id).length
                    return (
                      <tr key={f.id}>
                        <td>
                          <code className={s.codigo}>{f.codigo}</code>
                        </td>
                        <td>
                          <Link to={`/instructor/detalle-ficha/${f.id}`} className={s.nameLink}>
                            {f.nombre}
                          </Link>
                          <span className={s.subText}>
                            {f.programa}
                            {esMia ? ' · a tu cargo' : ` · ${f.instructorName || 'Sin instructor'}`}
                          </span>
                        </td>
                        <td>
                          <span className={s.count}>{estudiantes || f.aprendices}</span>
                        </td>
                        <td>
                          <span className={s.count}>{f.proyectos}</span>
                        </td>
                        <td>
                          <Badge variant={f.estado === 'activo' ? 'success' : 'neutral'}>
                            {displayNames.classGroupStatus[f.estado] || f.estado}
                          </Badge>
                        </td>
                        <td className={s.date}>{f.createdAt}</td>
                        <td className={s.colActions}>
                          <div className={s.actions}>
                            <Link
                              to={`/instructor/detalle-ficha/${f.id}`}
                              className={`${s.btn} ${s.secondary}`}
                            >
                              <Eye size={14} /> Ver
                            </Link>
                            <button
                              type="button"
                              className={`${s.btn} ${s.danger}`}
                              onClick={() => setAEliminar(f)}
                            >
                              <Trash size={14} /> Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              totalItems={filtradas.length}
              itemsPerPage={ITEMS_POR_PAGINA}
              paginaActual={pagina}
              setPaginaActual={setPagina}
              itemName="fichas"
              filteredCount={filtradas.length}
            />
          </>
        )}
      </div>

      <ConfirmModal
        open={!!aEliminar}
        titulo="Eliminar ficha"
        mensaje={
          aEliminar
            ? `¿Seguro que deseas eliminar la ficha "${aEliminar.nombre}" (${aEliminar.codigo})? Los aprendices asignados quedarán sin ficha. Esta acción no se puede deshacer.`
            : ''
        }
        textoConfirmar="Sí, eliminar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </DashboardLayout>
  )
}
