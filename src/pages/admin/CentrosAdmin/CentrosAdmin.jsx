import { useEffect, useRef, useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import DataPanel from '../../../components/DataPanel/DataPanel'
import FormField from '../../../components/FormField/FormField'
import Alert from '../../../components/Alert/Alert'
import Button from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import Actions from '../../../components/Actions/Actions'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import DataTable from '../../../components/DataTable/DataTable'
import { norm } from '../../../utils/helpers'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { Buildings, ChartBar, CheckCircle, PencilSimple, Plus, Trash } from 'phosphor-react'
import {
  getCentros,
  getFichasDeCentro,
  createCentro,
  updateCentro,
  deleteCentro,
  centroEnUso,
} from '../../../data/mockData'
import s from '../../../components/ListaBase/ListaBase.module.css'
import c from '../../../components/FormularioBase/FormularioBase.module.css'
import { PAGINA_TABLA } from '../../../constants/pagination'

const ITEMS_POR_PAGINA = PAGINA_TABLA

export default function CentrosAdmin() {
  const [modo, setModo] = useState('lista')
  const [editando, setEditando] = useState(null)
  const [msg, setMsg] = useState(null)
  const msgTimer = useRef(null)

  /* ---------- Lista ---------- */
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [aEliminar, setAEliminar] = useState(null)
  const [, setTick] = useState(0)
  const refrescar = () => setTick((t) => t + 1)

  const centros = getCentros()

  const filtrados = centros.filter((centro) => {
    const q = norm(busqueda.trim())
    return (
      !q ||
      norm(centro.nombre).includes(q) ||
      norm(centro.ciudad).includes(q)
    )
  })

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const limpiarFiltros = () => {
    setBusqueda('')
    setPagina(1)
  }

  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current) }, [])

  function mostrarMsg(texto) {
    setMsg(texto)
    if (msgTimer.current) clearTimeout(msgTimer.current)
    msgTimer.current = setTimeout(() => setMsg(null), 4000)
  }

  /* ---------- Formulario ---------- */
  const [form, setForm] = useState({ nombre: '', ciudad: '' })
  const [errores, setErrores] = useState({})

  function abrirCrear() {
    setEditando(null)
    setForm({ nombre: '', ciudad: '' })
    setErrores({})
    setModo('crear')
  }

  function abrirEditar(centro) {
    setEditando(centro)
    setForm({ nombre: centro.nombre, ciudad: centro.ciudad || '' })
    setErrores({})
    setModo('crear')
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((err) => ({ ...err, [name]: undefined }))
  }

  const validar = () => {
    const err = {}
    if (form.nombre.trim().length < 5) err.nombre = 'El nombre debe tener al menos 5 caracteres.'
    else if (getCentros().some((x) => (!editando || x.id !== editando.id) && x.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase())) {
      err.nombre = 'Ya existe un centro con ese nombre.'
    }
    return err
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    if (editando) {
      updateCentro({ id: editando.id, nombre: form.nombre.trim(), ciudad: form.ciudad.trim() })
      mostrarMsg('Centro actualizado correctamente.')
    } else {
      createCentro({ nombre: form.nombre.trim(), ciudad: form.ciudad.trim() })
      mostrarMsg('Centro creado correctamente.')
    }
    setModo('lista')
    setEditando(null)
    refrescar()
  }

  const confirmarEliminar = () => {
    if (!aEliminar) return
    const ok = deleteCentro(aEliminar.id)
    setAEliminar(null)
    refrescar()
    mostrarMsg(ok ? 'Centro eliminado.' : 'No se puede eliminar: tiene fichas asociadas.')
  }

  return (
    <DashboardLayout role="admin" titulo="Centros de Formación">
      <div className={s.page}>
        <PageHeader
          title={modo === 'lista' ? 'Centros de formación' : editando ? 'Editar centro' : 'Nuevo centro'}
          subtitle="Sedes regionales SENA a las que pertenecen las fichas de formación."
          icon={<Buildings />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Centros de formación' },
          ]}
          actions={
            modo === 'lista' ? (
              <Button type="button" onClick={abrirCrear}>
                <Plus size={14} /> Crear Centro
              </Button>
            ) : undefined
          }
        />

        {msg && (
          <Alert><CheckCircle size={14} /> {msg}</Alert>
        )}

        {modo === 'lista' ? (
          <>
            <FilterBar title="Buscar">
              <label className={s.field}>
                <span className={s.label}>Buscar</span>
                <Input
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value)
                    setPagina(1)
                  }}
                  placeholder="Nombre o ciudad…"
                />
              </label>
              <p className={s.info}>
                {filtrados.length} centro{filtrados.length !== 1 ? 's' : ''}
              </p>
            </FilterBar>

            {paginados.length === 0 ? (
              <EmptyState
                icon={<Buildings />}
                title="Sin centros"
                message={
                  centros.length === 0
                    ? 'Aún no hay centros registrados. Crea el primero.'
                    : 'Ningún centro coincide con la búsqueda.'
                }
                actionLabel={centros.length === 0 ? 'Crear primer centro' : 'Limpiar filtros'}
                onAction={centros.length === 0 ? abrirCrear : limpiarFiltros}
              />
            ) : (
              <>
                <DataTable
                  ariaLabel="Centros de formación"
                  columns={[
                    {
                      key: 'centro',
                      header: 'Centro',
                      render: (centro) => <span className={s.title}>{centro.nombre}</span>,
                    },
                    {
                      key: 'ciudad',
                      header: 'Ciudad',
                      render: (centro) => centro.ciudad || '—',
                    },
                    {
                      key: 'fichas',
                      header: 'Fichas',
                      render: (centro) => <span className={s.count}>{getFichasDeCentro(centro.id).length}</span>,
                    },
                    {
                      key: 'acciones',
                      header: 'Acciones',
                      align: 'end',
                      render: (centro) => {
                        const enUso = centroEnUso(centro.id)
                        return (
                          <div className={s.actions}>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => abrirEditar(centro)}
                            >
                              <PencilSimple size={14} /> Editar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              disabled={enUso}
                              title={enUso ? 'No se puede eliminar: tiene fichas asociadas' : undefined}
                              onClick={() => setAEliminar(centro)}
                            >
                              <Trash size={14} /> Eliminar
                            </Button>
                          </div>
                        )
                      },
                    },
                  ]}
                  rows={paginados}
                  keyOf={(centro) => centro.id}
                />

                <Pagination
                  totalItems={filtrados.length}
                  itemsPerPage={ITEMS_POR_PAGINA}
                  paginaActual={pagina}
                  setPaginaActual={setPagina}
                  itemName="centros"
                  filteredCount={filtrados.length}
                />
              </>
            )}
          </>
        ) : (
          <DataPanel title={editando ? 'Editar centro' : 'Nuevo centro'} icon={<Buildings />}>
            <form className={c.form} onSubmit={onSubmit} noValidate>
              <FormField label="Nombre del centro" required error={errores.nombre}>
                <Input
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  placeholder="Ej. Centro de Teleinformática y Producción Industrial"
                  maxLength={120}
                />
              </FormField>

              <FormField label="Ciudad" help="Opcional.">
                <Input
                  name="ciudad"
                  value={form.ciudad}
                  onChange={onChange}
                  placeholder="Ej. Popayán"
                  maxLength={60}
                />
              </FormField>

              <Actions form>
                <Button type="submit">
                  <CheckCircle size={14} /> {editando ? 'Guardar cambios' : 'Crear centro'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setModo('lista'); setEditando(null) }}>
                  Cancelar
                </Button>
              </Actions>
            </form>
          </DataPanel>
        )}
      </div>

      <ConfirmModal
        open={!!aEliminar}
        titulo="Eliminar centro"
        mensaje={
          aEliminar
            ? `¿Seguro que deseas eliminar "${aEliminar.nombre}"? Esta acción no se puede deshacer.`
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
