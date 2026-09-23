import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import Avatar from '../../../components/Avatar/Avatar'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import Pagination from '../../../components/Pagination/Pagination'
import { Select } from '../../../components/Input/Input'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { fichas, instructores } from '../../../lib/recursos'
import { PAGINA_TARJETAS } from '../../../constants/pagination'
import s from './DirectorioFichaInstructor.module.css'
import { ArrowRight, Books, ChartBar, LockKey, MagnifyingGlass, Users } from 'phosphor-react'

const ITEMS_POR_PAGINA = PAGINA_TARJETAS

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

export default function DirectorioFichaInstructor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('az')
  const [pagina, setPagina] = useState(1)

  // Ficha con aprendices incluidos y catálogo de instructores para autorizar.
  const { data: ficha, cargando, error, recargar } = useApi(
    () => fichas.obtener(id),
    [id],
    { inicial: null }
  )
  const { data: instructoresApi } = useApi(() => instructores.listar(), [], { inicial: [] })

  const miFila = useMemo(
    () => instructoresApi.find((i) => Number(i.id_usuario) === Number(user?.id)) || null,
    [instructoresApi, user?.id]
  )

  const estudiantes = ficha?.apprentices || []

  // Autorización: solo el instructor a cargo de la ficha.
  const autorizado = !!ficha && Number(ficha.instructor?.id) === Number(miFila?.id)

  if (cargando) {
    return (
      <DashboardLayout role="instructor" titulo="Directorio de Ficha">
        <div className={s.page}><ApiState cargando /></div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="instructor" titulo="Directorio de Ficha">
        <div className={s.page}><ApiState error={error} onReintentar={recargar} /></div>
      </DashboardLayout>
    )
  }

  if (!ficha) {
    return (
      <DashboardLayout role="instructor" titulo="Directorio de Ficha">
        <div className={s.page}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Ficha no encontrada"
            message="La ficha que buscas no existe o fue eliminada."
            actionLabel="Volver a fichas"
            onAction={() => navigate('/instructor/fichas')}
          />
        </div>
      </DashboardLayout>
    )
  }

  if (!autorizado) {
    return (
      <DashboardLayout role="instructor" titulo="Directorio de Ficha">
        <div className={s.page}>
          <EmptyState
            icon={<LockKey size={40} weight="light" />}
            title="Esta ficha no está a tu cargo"
            message="Pertenece a otro instructor. Solo puedes ver los directorios de tus propias fichas."
            actionLabel="Volver al dashboard"
            onAction={() => navigate('/instructor/dashboard')}
          />
        </div>
      </DashboardLayout>
    )
  }

  const q = busqueda.trim().toLowerCase()
  const filtrados = estudiantes
    .filter((est) => {
      const g = est.generalUser || {}
      const nombre = nombreCompleto(g).toLowerCase()
      const correo = (g.correo || '').toLowerCase()
      return !q || nombre.includes(q) || correo.includes(q)
    })
    .sort((a, b) => {
      const na = nombreCompleto(a.generalUser).toLowerCase()
      const nb = nombreCompleto(b.generalUser).toLowerCase()
      return orden === 'za' ? nb.localeCompare(na) : na.localeCompare(nb)
    })

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  return (
    <DashboardLayout role="instructor" titulo="Directorio de Ficha">
      <div className={s.page}>
        <PageHeader
          title={`Directorio · ${ficha.nombre}`}
          subtitle={`${estudiantes.length} aprendiz${estudiantes.length !== 1 ? 'es' : ''} en la ficha ${ficha.codigo}`}
          icon={<Users />}
          breadcrumb={[
            { label: 'Dashboard', to: '/instructor/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Fichas', to: '/instructor/fichas', icon: <Books size={14} /> },
            { label: ficha.nombre, to: `/instructor/detalle-ficha/${ficha.id}` },
            { label: 'Directorio' },
          ]}
        />

        {estudiantes.length > 0 && (
          <div className={s.searchBar}>
            <input
              className={s.search}
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
              placeholder="Buscar por nombre o correo…"
              aria-label="Buscar aprendiz"
            />
            <Select
              value={orden}
              onChange={(e) => { setOrden(e.target.value); setPagina(1) }}
              aria-label="Ordenar aprendices"
            >
              <option value="az">Nombre (A–Z)</option>
              <option value="za">Nombre (Z–A)</option>
            </Select>
          </div>
        )}

        {filtrados.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={estudiantes.length === 0 ? 'Sin aprendices' : 'Sin resultados'}
            message={
              estudiantes.length === 0
                ? 'Todavía ningún aprendiz se ha unido a esta ficha.'
                : `Ningún aprendiz coincide con "${busqueda}".`
            }
          />
        ) : (
          <ul className={s.grid}>
            {paginados.map((est) => {
              const g = est.generalUser || {}
              const programa = ficha.program?.nombre
              return (
                <li key={est.id} className={s.card}>
                  <Avatar name={nombreCompleto(g)} src={g.foto_url} size="lg" />
                  <h3 className={s.name}>{nombreCompleto(g)}</h3>
                  <p className={s.email}>{g.correo}</p>
                  {programa && (
                    <Badge variant="info" className={s.programa}>
                      {programa}
                    </Badge>
                  )}
                  <Button
                    as="link"
                    to={`/instructor/perfil-companero/${g.id}`}
                    viewTransition
                    variant="secondary"
                  >
                    Ver perfil <ArrowRight size={14} />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        <Pagination
          totalItems={filtrados.length}
          itemsPerPage={ITEMS_POR_PAGINA}
          paginaActual={pagina}
          setPaginaActual={setPagina}
          itemName="aprendices"
          filteredCount={filtrados.length}
        />
      </div>
    </DashboardLayout>
  )
}
