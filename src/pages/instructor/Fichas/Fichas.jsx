import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import DataPanel from '../../../components/DataPanel/DataPanel'
import FormField from '../../../components/FormField/FormField'
import Badge from '../../../components/Badge/Badge'
import Alert from '../../../components/Alert/Alert'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { ArrowClockwise, Books, CheckCircle, Eye, Plus, Trash } from 'phosphor-react'
import { useAuth } from '../../../contexts/AuthContext'
import {
  getAllFichas,
  getFichasDelInstructor,
  createFicha,
  generarCodigoFicha,
  deleteFicha,
  getEstudiantesDeFicha,
  displayNames,
} from '../../../data/mockData'
// Estilos reutilizados de las páginas originales (lista + formulario)
import s from '../GestionarFichas/GestionarFichas.module.css'
import c from '../CrearFicha/CrearFicha.module.css'

const ITEMS_POR_PAGINA = 8

const PROGRAMAS = [
  'ADSO',
  'Produccion Multimedia',
  'Infraestructura Redes',
  'Contabilidad y Finanzas',
  'Otro',
]

export default function Fichas() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [creando, setCreando] = useState(() => searchParams.get('crear') === '1')
  const [creadaMsg, setCreadaMsg] = useState(false)
  const msgTimer = useRef(null)

  /* ---------- Lista ---------- */
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [aEliminar, setAEliminar] = useState(null)
  const [, setTick] = useState(0)
  const refrescar = () => setTick((t) => t + 1)

  // Modelo Classroom: solo las fichas creadas por este instructor
  const fichas = getFichasDelInstructor(Number(user?.id))

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

  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current) }, [])

  function mostrarCreada() {
    setCreadaMsg(true)
    if (msgTimer.current) clearTimeout(msgTimer.current)
    msgTimer.current = setTimeout(() => setCreadaMsg(false), 3500)
  }

  function abrirCreacion() {
    setCreadaMsg(false)
    setCreando(true)
  }

  const confirmarEliminar = () => {
    if (!aEliminar) return
    deleteFicha(aEliminar.id)
    setAEliminar(null)
    refrescar()
  }

  /* ---------- Creación ---------- */
  const [codigo, setCodigo] = useState(() => generarCodigoFicha())
  const [form, setForm] = useState({ nombre: '', programa: '', horario: 'manana', descripcion: '' })
  const [errores, setErrores] = useState({})

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((err) => ({ ...err, [name]: undefined }))
  }

  const regenerarCodigo = () => setCodigo(generarCodigoFicha())

  const validar = () => {
    const err = {}
    if (!form.nombre.trim()) err.nombre = 'El nombre de la ficha es obligatorio.'
    if (!form.programa) err.programa = 'Selecciona un programa de formación.'
    return err
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    createFicha({
      nombre: form.nombre.trim(),
      programa: form.programa,
      instructorName: user?.nombre || '',
      instructorId: Number(user?.id) || null,
    })
    setForm({ nombre: '', programa: '', horario: 'manana', descripcion: '' })
    setErrores({})
    setCodigo(generarCodigoFicha())
    setCreando(false)
    refrescar()
    mostrarCreada()
  }

  return (
    <DashboardLayout role="instructor" titulo={creando ? 'Crear Ficha' : 'Fichas'}>
      <div className={s.page}>
        <PageHeader
          title={creando ? 'Crear Ficha' : 'Gestionar Fichas'}
          subtitle={
            creando
              ? 'Registra una nueva ficha de formación y queda asignado como su instructor.'
              : 'Consulta las fichas de formación, revisa sus aprendices y administra su información.'
          }
          icon={creando ? <Plus /> : <Books />}
          actions={
            !creando ? (
              <Button type="button" onClick={abrirCreacion}>
                <Plus size={14} /> Crear Ficha
              </Button>
            ) : undefined
          }
        />

        {creando ? (
          <DataPanel title="Datos de la ficha" icon={<Books />}>
            <form className={c.form} onSubmit={onSubmit} noValidate>
              <FormField label="Nombre de la ficha" required error={errores.nombre}>
                <input
                  className={c.input}
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  placeholder="Ej. Análisis y Desarrollo 2718"
                  maxLength={80}
                />
              </FormField>

              <FormField label="Programa de formación" required error={errores.programa}>
                <select className={c.select} name="programa" value={form.programa} onChange={onChange}>
                  <option value="">Selecciona un programa…</option>
                  {PROGRAMAS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Código de la ficha"
                help="El sistema genera un código único automáticamente. Los aprendices lo usarán para unirse."
              >
                <div className={c.codigoRow}>
                  <code className={c.codigo}>{codigo}</code>
                  <button type="button" className={`${c.btn} ${c.ghost}`} onClick={regenerarCodigo}>
                    <ArrowClockwise size={14} /> Regenerar
                  </button>
                </div>
              </FormField>

              <FormField label="Horario" help={`Jornada seleccionada: ${form.horario === 'manana' ? 'Lunes a Viernes · Mañana (6:00–12:00)' : 'Lunes a Viernes · Tarde (12:00–18:00)'}`}>
                <select className={c.select} name="horario" value={form.horario} onChange={onChange}>
                  <option value="manana">Lunes a Viernes · Mañana (6:00–12:00)</option>
                  <option value="tarde">Lunes a Viernes · Tarde (12:00–18:00)</option>
                </select>
              </FormField>

              <FormField label="Descripción" help="Opcional. Describe el enfoque o jornada de la ficha.">
                <textarea
                  className={c.textarea}
                  name="descripcion"
                  rows={4}
                  value={form.descripcion}
                  onChange={onChange}
                  placeholder="Ej. Ficha enfocada en desarrollo de software con énfasis en proyectos productivos…"
                />
              </FormField>

              <div className={c.formActions}>
                <button type="submit" className={`${c.btn} ${c.primary}`}>
                  <CheckCircle size={14} /> Crear ficha
                </button>
                <button type="button" className={`${c.btn} ${c.secondary}`} onClick={() => setCreando(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </DataPanel>
        ) : (
          <>
            {creadaMsg && (
              <Alert>
                <CheckCircle size={14} /> Ficha creada correctamente.
              </Alert>
            )}

            <FilterBar title="Buscar y filtrar">
              <label className={s.field}>
                <span className={s.label}>Buscar</span>
                <Input
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
                <Select
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
                </Select>
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
                    ? 'Aún no se han creado fichas de formación. Crea la primera.'
                    : 'Ninguna ficha coincide con los filtros aplicados.'
                }
                actionLabel={fichas.length === 0 ? 'Crear primera ficha' : undefined}
                onAction={fichas.length === 0 ? abrirCreacion : undefined}
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
                        <th>Propuestas</th>
                        <th>Estado</th>
                        <th>Creada</th>
                        <th className={s.colActions}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginadas.map((f) => {
                        const estudiantes = getEstudiantesDeFicha(f.id).length
                        return (
                          <tr key={f.id}>
                            <td data-label="Código">
                              <code className={s.codigo}>{f.codigo}</code>
                            </td>
                            <td data-label="Ficha">
                              <Link to={`/instructor/detalle-ficha/${f.id}`} className={s.nameLink}>
                                {f.nombre}
                              </Link>
                              <span className={s.subText}>{f.programa}</span>
                            </td>
                            <td data-label="Aprendices">
                              <span className={s.count}>{estudiantes || f.aprendices}</span>
                            </td>
                            <td data-label="Propuestas">
                              <span className={s.count}>{f.proyectos}</span>
                            </td>
                            <td data-label="Estado">
                              <Badge variant={f.estado === 'activo' ? 'success' : 'neutral'}>
                                {displayNames.classGroupStatus[f.estado] || f.estado}
                              </Badge>
                            </td>
                            <td data-label="Creada" className={s.date}>{f.createdAt}</td>
                            <td data-label="Acciones" className={s.colActions}>
                              <div className={s.actions}>
                                <Button
                                  as="link"
                                  to={`/instructor/detalle-ficha/${f.id}`}
                                  size="sm"
                                  variant="secondary"
                                >
                                  <Eye size={14} /> Ver
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="danger"
                                  onClick={() => setAEliminar(f)}
                                >
                                  <Trash size={14} /> Eliminar
                                </Button>
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
