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
import ApiState from '../../../components/ApiState/ApiState'
import { norm } from '../../../utils/helpers'
import { MAX_TITULO, MAX_CIUDAD } from '../../../utils/validation'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import MotivoBloqueo from '../../../components/MotivoBloqueo/MotivoBloqueo'
import { Buildings, ChartBar, CheckCircle, PencilSimple, Plus, Trash, Warning } from 'phosphor-react'
import { useApi } from '../../../lib/useApi'
import { centros, fichas } from '../../../lib/recursos'
import { toFieldErrors } from '../../../lib/api'
import s from '../../../components/ListaBase/ListaBase.module.css'
import c from '../../../components/FormularioBase/FormularioBase.module.css'
import { PAGINA_TABLA } from '../../../constants/pagination'

const ITEMS_POR_PAGINA = PAGINA_TABLA

export default function TrainingCentersAdmin() {
  const [modo, setModo] = useState('lista')
  const [editando, setEditando] = useState(null)
  const [msg, setMsg] = useState(null)
  const [msgTipo, setMsgTipo] = useState('ok')
  const msgTimer = useRef(null)

  /* ---------- Lista ---------- */
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [aEliminar, setAEliminar] = useState(null)

  // Fuente única: la API. Centros + fichas (para contar cuántas tiene cada uno).
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [listaCentros, listaFichas] = await Promise.all([centros.listar(), fichas.listar()])
      return { listaCentros, listaFichas }
    },
    [],
    { inicial: null }
  )

  const listaCentros = data?.listaCentros || []
  const listaFichas = data?.listaFichas || []

  // Conteo de fichas por centro (training_center_id).
  const fichasPorCentro = new Map()
  for (const f of listaFichas) {
    const key = Number(f.training_center_id)
    fichasPorCentro.set(key, (fichasPorCentro.get(key) || 0) + 1)
  }
  const fichasDeCentro = (centroId) => fichasPorCentro.get(Number(centroId)) || 0

  const filtrados = listaCentros.filter((centro) => {
    const q = norm(busqueda.trim())
    return !q || norm(centro.name).includes(q) || norm(centro.city).includes(q)
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

  function mostrarMsg(texto, tipo = 'ok') {
    setMsgTipo(tipo)
    setMsg(texto)
    if (msgTimer.current) clearTimeout(msgTimer.current)
    msgTimer.current = setTimeout(() => setMsg(null), 4000)
  }

  /* ---------- Formulario ---------- */
  const [form, setForm] = useState({ name: '', city: '' })
  const [errores, setErrores] = useState({})

  function abrirCrear() {
    setEditando(null)
    setForm({ name: '', city: '' })
    setErrores({})
    setModo('crear')
  }

  function abrirEditar(centro) {
    setEditando(centro)
    setForm({ name: centro.name || '', city: centro.city || '' })
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
    if (form.name.trim().length < 5) err.name = 'El nombre debe tener al menos 5 caracteres.'
    else if (listaCentros.some((x) => (!editando || Number(x.id) !== Number(editando.id)) && String(x.name || '').trim().toLowerCase() === form.name.trim().toLowerCase())) {
      err.name = 'Ya existe un centro con ese nombre.'
    }
    return err
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    const payload = { name: form.name.trim(), city: form.city.trim() || null }
    try {
      if (editando) await centros.actualizar(editando.id, payload)
      else await centros.crear(payload)
      await recargar()
      setModo('lista')
      setEditando(null)
      mostrarMsg(editando ? 'Centro actualizado correctamente.' : 'Centro creado correctamente.')
    } catch (error) {
      const campos = toFieldErrors(error?.data)
      if (campos.name) {
        setErrores({ name: String(campos.name).includes('taken') || String(campos.name).includes('unique') ? 'Ya existe un centro con ese nombre.' : campos.name })
        return
      }
      mostrarMsg(error?.data?.message || 'No se pudo guardar el centro. Intenta de nuevo.', 'error')
    }
  }

  const confirmarEliminar = async () => {
    if (!aEliminar) return
    try {
      await centros.eliminar(aEliminar.id)
      setAEliminar(null)
      await recargar()
      mostrarMsg('Centro eliminado.')
    } catch (error) {
      setAEliminar(null)
      mostrarMsg(error?.data?.message || 'No se pudo eliminar el centro. Intenta de nuevo.', 'error')
    }
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
          <Alert variant={msgTipo === 'error' ? 'danger' : undefined}>
            {msgTipo === 'error' ? <Warning size={14} /> : <CheckCircle size={14} />} {msg}
          </Alert>
        )}

        <ApiState cargando={cargando} error={error} onReintentar={recargar}>
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
                    listaCentros.length === 0
                      ? 'Aún no hay centros registrados. Crea el primero.'
                      : 'Ningún centro coincide con la búsqueda.'
                  }
                  actionLabel={listaCentros.length === 0 ? 'Crear primer centro' : 'Limpiar filtros'}
                  onAction={listaCentros.length === 0 ? abrirCrear : limpiarFiltros}
                />
              ) : (
                <>
                  <DataTable
                    ariaLabel="Centros de formación"
                    columns={[
                      {
                        key: 'centro',
                        header: 'Centro',
                        render: (centro) => <span className={s.title}>{centro.name}</span>,
                      },
                      {
                        key: 'ciudad',
                        header: 'Ciudad',
                        render: (centro) => centro.city || '—',
                      },
                      {
                        key: 'fichas',
                        header: 'Fichas',
                        render: (centro) => <span className={s.count}>{fichasDeCentro(centro.id)}</span>,
                      },
                      {
                        key: 'acciones',
                        header: 'Acciones',
                        align: 'end',
                        render: (centro) => {
                          const enUso = fichasDeCentro(centro.id) > 0
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
                              <span className={s.accionCol}>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="danger"
                                  disabled={enUso}
                                  aria-describedby={enUso ? `motivo-centro-${centro.id}` : undefined}
                                  title={enUso ? 'No se puede eliminar: tiene fichas asociadas' : undefined}
                                  onClick={() => setAEliminar(centro)}
                                >
                                  <Trash size={14} /> Eliminar
                                </Button>
                                {enUso && (
                                  <MotivoBloqueo compact id={`motivo-centro-${centro.id}`}>
                                    En uso · {fichasDeCentro(centro.id)} ficha(s)
                                  </MotivoBloqueo>
                                )}
                              </span>
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
                <FormField label="Nombre del centro" required error={errores.name}>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="Ej. Centro de Teleinformática y Producción Industrial"
                    maxLength={MAX_TITULO}
                  />
                </FormField>

                <FormField label="Ciudad" help="Opcional.">
                  <Input
                    name="city"
                    value={form.city}
                    onChange={onChange}
                    placeholder="Ej. Popayán"
                    maxLength={MAX_CIUDAD}
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
        </ApiState>
      </div>

      <ConfirmModal
        open={!!aEliminar}
        titulo="Eliminar centro"
        mensaje={
          aEliminar
            ? `¿Seguro que deseas eliminar "${aEliminar.name}"? Esta acción no se puede deshacer.`
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
