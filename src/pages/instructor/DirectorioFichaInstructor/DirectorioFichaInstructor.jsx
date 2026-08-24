import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import Avatar from '../../../components/Avatar/Avatar'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { useAuth } from '../../../contexts/AuthContext'
import { findFichaById, getEstudiantesDeFicha, instructorVeFicha } from '../../../data/mockData'
import s from './DirectorioFichaInstructor.module.css'
import { ArrowRight, Books, ChartBar, MagnifyingGlass, Users } from 'phosphor-react'

export default function DirectorioFichaInstructor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [busqueda, setBusqueda] = useState('')

  const ficha = findFichaById(id)
  const estudiantes = ficha ? getEstudiantesDeFicha(ficha.id) : []

  // Autorización: solo el instructor a cargo de la ficha
  const autorizado = ficha && instructorVeFicha(ficha, user?.id)

  if (!ficha) {
    return (
      <DashboardLayout role="instructor" titulo="Directorio de Ficha">
        <div className={s.page}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Ficha no encontrada"
            message="La ficha que buscas no existe o fue eliminada."
            actionLabel="Volver a fichas"
            onAction={() => navigate('/instructor/gestionar-fichas')}
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
  const filtrados = estudiantes.filter(
    (e) =>
      !q ||
      e.name.toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q)
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
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o correo…"
              aria-label="Buscar aprendiz"
            />
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
            {filtrados.map((est) => (
              <li key={est.id} className={s.card}>
                <Avatar name={est.name} src={est.fotoPerfil} size="lg" />
                <h3 className={s.name}>{est.name}</h3>
                <p className={s.email}>{est.email}</p>
                {est.programa && (
                  <Badge variant="info" className={s.programa}>
                    {est.programa}
                  </Badge>
                )}
                <Button
                  as="link"
                  to={`/instructor/perfil-companero/${est.id}`}
                  variant="secondary"
                >
                  Ver perfil <ArrowRight size={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  )
}
