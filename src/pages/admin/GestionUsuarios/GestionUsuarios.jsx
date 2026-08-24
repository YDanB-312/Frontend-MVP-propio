import { useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Avatar from '../../../components/Avatar/Avatar'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import { Users, Plus, Eye, Pause, Play } from 'phosphor-react'
import {
  getAllUsers,
  findFichaById,
  setUserActive,
  displayNames,
} from '../../../data/mockData'
import s from './GestionUsuarios.module.css'

const ITEMS_POR_PAGINA = 8

const ROL_VARIANT = { aprendiz: 'info', instructor: 'primary', admin: 'warning' }

export default function GestionUsuarios() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [aDesactivar, setADesactivar] = useState(null)
  const [, setTick] = useState(0)
  const refrescar = () => setTick((t) => t + 1)

  const usuarios = getAllUsers()

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.trim().toLowerCase()
    const coincideQ =
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const coincideRol = filtroRol === 'todos' || u.role === filtroRol
    return coincideQ && coincideRol
  })

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const confirmarDesactivar = () => {
    if (!aDesactivar) return
    setUserActive(aDesactivar.id, false)
    setADesactivar(null)
  }

  const activar = (u) => {
    setUserActive(u.id, true)
    refrescar()
  }

  return (
    <DashboardLayout role="admin" titulo="Gestionar Usuarios">
      <div className={s.page}>
        <PageHeader
          title="Gestión de Usuarios"
          subtitle="Administra las cuentas de aprendices, instructores y administradores de la plataforma."
          icon={<Users />}
          actions={
            <Button as="link" to="/admin/nuevo-usuario" size="sm">
              <Plus size={14} /> Nuevo Usuario
            </Button>
          }
        />

        <FilterBar title="Buscar y filtrar">
          <label className={s.field}>
            <span className={s.label}>Buscar</span>
            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPagina(1)
              }}
              placeholder="Nombre o correo…"
            />
          </label>
          <label className={s.field}>
            <span className={s.label}>Rol</span>
            <Select
              value={filtroRol}
              onChange={(e) => {
                setFiltroRol(e.target.value)
                setPagina(1)
              }}
            >
              <option value="todos">Todos</option>
              <option value="aprendiz">Aprendiz</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Administrador</option>
            </Select>
          </label>
          <p className={s.info}>
            {filtrados.length} usuario{filtrados.length !== 1 ? 's' : ''}
          </p>
        </FilterBar>

        {paginados.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Sin usuarios"
            message={
              usuarios.length === 0
                ? 'No hay usuarios registrados en la plataforma.'
                : 'Ningún usuario coincide con los filtros aplicados.'
            }
          />
        ) : (
          <>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Ficha</th>
                    <th>Estado</th>
                    <th className={s.colActions}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((u) => {
                    const ficha = u.fichaId ? findFichaById(u.fichaId) : null
                    const activo = u.estado === 1
                    return (
                      <tr key={u.id}>
                        <td>
                          <Link to={`/admin/detalle-usuario/${u.id}`} className={s.userCell}>
                            <Avatar name={u.name} src={u.fotoPerfil} size="sm" />
                            <span className={s.userName}>{u.name}</span>
                          </Link>
                        </td>
                        <td className={s.email}>{u.email}</td>
                        <td>
                          <Badge variant={ROL_VARIANT[u.role] || 'neutral'}>
                            {displayNames.userRole[u.role] || u.role}
                          </Badge>
                        </td>
                        <td>
                          {ficha ? (
                            <code className={s.codigo}>{ficha.codigo}</code>
                          ) : (
                            <span className={s.muted}>—</span>
                          )}
                        </td>
                        <td>
                          {activo ? (
                            <Badge variant="success">Activo</Badge>
                          ) : (
                            <Badge variant="danger">Inactivo</Badge>
                          )}
                        </td>
                        <td className={s.colActions}>
                          <div className={s.actions}>
                            <Button
                              as="link"
                              to={`/admin/detalle-usuario/${u.id}`}
                              size="sm"
                              variant="secondary"
                            >
                              <Eye size={14} /> Ver
                            </Button>
                            {activo ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="danger"
                                onClick={() => setADesactivar(u)}
                              >
                                <Pause size={14} /> Desactivar
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="success"
                                onClick={() => activar(u)}
                              >
                                <Play size={14} /> Activar
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
              itemName="usuarios"
              filteredCount={filtrados.length}
            />
          </>
        )}
      </div>

      <ConfirmModal
        open={!!aDesactivar}
        titulo="Desactivar usuario"
        mensaje={
          aDesactivar
            ? `¿Seguro que deseas desactivar la cuenta de "${aDesactivar.name}"? No podrá iniciar sesión hasta que la reactives.`
            : ''
        }
        textoConfirmar="Sí, desactivar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarDesactivar}
        onCancelar={() => setADesactivar(null)}
      />
    </DashboardLayout>
  )
}
