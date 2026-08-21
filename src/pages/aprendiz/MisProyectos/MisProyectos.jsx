import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import Badge from '../../../components/Badge/Badge'
import { CalendarBlank, FolderOpen, MagnifyingGlass, Plus, Tray } from 'phosphor-react'
import { useAuth } from '../../../contexts/AuthContext'
import { getProjectsByStudent, getAllSimilarities, displayNames } from '../../../data/mockData'
import s from './MisProyectos.module.css'

const ITEMS_POR_PAGINA = 6

const ESTADO_VARIANT = {
  aprobado: 'success',
  completado: 'success',
  pendiente: 'warning',
  requiere_ajustes: 'warning',
  en_revision: 'info',
  en_progreso: 'primary',
  rechazado: 'danger',
  cancelado: 'danger',
  borrador: 'neutral',
}

function similitudInfo(similitudes, projectId) {
  const propias = similitudes.filter((s) => s.projectId1 === projectId || s.projectId2 === projectId)
  if (propias.length === 0) return null
  return {
    pct: Math.max(...propias.map((s) => Math.round(s.similitud * 100))),
    count: propias.length,
  }
}

export default function MisProyectos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('todos')
  const [pagina, setPagina] = useState(1)

  const proyectos = useMemo(() => getProjectsByStudent(user.id), [user.id])
  const similitudes = useMemo(() => getAllSimilarities(), [])

  const filtrados = useMemo(
    () => (filtro === 'todos' ? proyectos : proyectos.filter((p) => p.estado === filtro)),
    [proyectos, filtro]
  )

  const inicio = (pagina - 1) * ITEMS_POR_PAGINA
  const visibles = filtrados.slice(inicio, inicio + ITEMS_POR_PAGINA)

  function cambiarFiltro(valor) {
    setFiltro(valor)
    setPagina(1)
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Mis Proyectos">
      <div className={s.wrapper}>
        <PageHeader
          title="Mis Proyectos"
          subtitle="Administra y revisa el estado de tus propuestas académicas"
          icon={<FolderOpen />}
          actions={
            <Link to="/aprendiz/nuevo-proyecto" className={`${s.btn} ${s.primary}`}>
              <Plus size={14} /> Nueva propuesta
            </Link>
          }
        />

        <FilterBar title="Filtros">
          <label className={s.filterField}>
            <span className={s.filterLabel}>Estado</span>
            <select
              className={s.select}
              value={filtro}
              onChange={(e) => cambiarFiltro(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En Revisión</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="requiere_ajustes">Requiere Ajustes</option>
            </select>
          </label>
        </FilterBar>

        {filtrados.length === 0 ? (
          <EmptyState
            icon={<Tray />}
            title={filtro === 'todos' ? 'Aún no tienes proyectos' : 'Sin resultados'}
            message={
              filtro === 'todos'
                ? 'Registra tu primera propuesta para comenzar a analizarla con DetectaIA.'
                : 'No hay proyectos con el estado seleccionado. Prueba con otro filtro.'
            }
            actionLabel={filtro === 'todos' ? 'Crear propuesta' : undefined}
            actionIcon={<Plus size={14} />}
            onAction={filtro === 'todos' ? () => navigate('/aprendiz/nuevo-proyecto') : undefined}
          />
        ) : (
          <>
            <div className={s.grid}>
              {visibles.map((p) => {
                const info = similitudInfo(similitudes, p.id)
                return (
                  <Link key={p.id} to={`/aprendiz/detalle-proyecto/${p.id}`} className={s.card}>
                    <header className={s.cardHeader}>
                      <h3 className={s.cardTitle}>{p.title}</h3>
                      <Badge variant={ESTADO_VARIANT[p.estado] || 'neutral'}>
                        {displayNames.projectStatus[p.estado] || p.estado}
                      </Badge>
                    </header>
                    <p className={s.cardDesc}>{p.description}</p>
                    <footer className={s.cardFooter}>
                      <span className={s.cardMeta}><CalendarBlank size={14} /> {p.createdAt}</span>
                      {info && (
                        <Badge variant={info.pct >= 70 ? 'danger' : info.pct >= 40 ? 'warning' : 'success'}>
                          <MagnifyingGlass size={14} /> {info.pct}% · {info.count} coincidencia{info.count !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </footer>
                  </Link>
                )
              })}
            </div>
            <Pagination
              totalItems={proyectos.length}
              filteredCount={filtrados.length}
              itemsPerPage={ITEMS_POR_PAGINA}
              paginaActual={pagina}
              setPaginaActual={setPagina}
              itemName="proyectos"
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
