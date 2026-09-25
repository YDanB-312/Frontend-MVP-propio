import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import DataPanel from '../../../components/DataPanel/DataPanel'
import FormField from '../../../components/FormField/FormField'
import Badge from '../../../components/Badge/Badge'
import Alert from '../../../components/Alert/Alert'
import MotivoBloqueo from '../../../components/MotivoBloqueo/MotivoBloqueo'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import Actions from '../../../components/Actions/Actions'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { ArrowClockwise, Books, ChartBar, CheckCircle, Copy, Eye, Plus, Trash, Warning } from 'phosphor-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { toFieldErrors } from '../../../lib/api'
import { fichas, instructores, aprendices, proyectos, redes, programas } from '../../../lib/recursos'
import { FICHA_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import { generarCodigoFicha } from '../../../utils/helpers'
import { MAX_NOMBRE, MAX_NUMERO_FICHA } from '../../../utils/validation'
import { PAGINA_TABLA } from '../../../constants/pagination'
// Estilos reutilizados de las páginas originales (lista + formulario)
import s from '../../../components/ListaBase/ListaBase.module.css'
import c from '../../../components/FormularioBase/FormularioBase.module.css'

const ITEMS_POR_PAGINA = PAGINA_TABLA

const ESTADO_LABEL = {
  activo: 'Activo',
  finalizado: 'Finalizado',
}

export default function Fichas() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [creando, setCreando] = useState(() => searchParams.get('crear') === '1')

  // Reacciona si se navega a ?crear=1 ya estando en la lista
  useEffect(() => {
    if (searchParams.get('crear') === '1') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreando(true)
    }
  }, [searchParams])

  const [creadaMsg, setCreadaMsg] = useState(false)
  const [accionMsg, setAccionMsg] = useState('')
  const msgTimer = useRef(null)

  /* ---------- Lista ---------- */
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroRed, setFiltroRed] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [aEliminar, setAEliminar] = useState(null)
  const [copiado, setCopiado] = useState(null)

  // Catálogos y datos: fuente única la API.
  const { data: instructoresApi } = useApi(() => instructores.listar(), [], { inicial: [] })
  const { data: aprendicesApi } = useApi(() => aprendices.listar(), [], { inicial: [] })
  const { data: todosProyectos } = useApi(() => proyectos.listar(), [], { inicial: [] })
  const { data: fichasApi, cargando, error, recargar } = useApi(() => fichas.listar(), [], { inicial: [] })
  const { data: redesApi } = useApi(() => redes.listar(), [], { inicial: [] })

  // Fila de perfil del instructor (instructors) del usuario autenticado.
  const miFila = useMemo(
    () => instructoresApi.find((i) => Number(i.id_usuario) === Number(user?.id)) || null,
    [instructoresApi, user?.id]
  )

  // Modelo Classroom: solo las fichas creadas por este instructor.
  const fichasPropias = useMemo(
    () => fichasApi.filter((f) => Number(f.instructor?.id) === Number(miFila?.id)),
    [fichasApi, miFila?.id]
  )

  const filtradas = fichasPropias.filter((f) => {
    const q = busqueda.trim().toLowerCase()
    const coincideQ =
      !q ||
      f.nombre.toLowerCase().includes(q) ||
      (f.codigo || '').toLowerCase().includes(q) ||
      String(f.numero || '').toLowerCase().includes(q) ||
      (f.program?.nombre || '').toLowerCase().includes(q)
    const coincideEstado = filtroEstado === 'todos' || f.estado === filtroEstado
    const coincideRed = filtroRed === 'todos' || String(f.program?.knowledge_network_id || '') === String(filtroRed)
    return coincideQ && coincideEstado && coincideRed
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

  const confirmarEliminar = async () => {
    if (!aEliminar) return
    try {
      await fichas.eliminar(aEliminar.id)
      setAccionMsg('')
    } catch (err) {
      setAccionMsg(err?.data?.message || 'No se pudo eliminar la ficha. Intenta de nuevo.')
    }
    setAEliminar(null)
    await recargar()
  }

  /* ---------- Creación ---------- */
  const { data: programasApi } = useApi(() => programas.listar(), [], { inicial: [] })

  const [codigo, setCodigo] = useState(() => generarCodigoFicha([]))
  const [form, setForm] = useState({ red: '', programaId: '', nombre: '', numero: '' })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((err) => ({ ...err, [name]: undefined }))
  }

  function alCambiarRed(e) {
    const { value } = e.target
    setForm((f) => ({ ...f, red: value, programaId: '' }))
    setErrores((err) => ({ ...err, red: undefined, programaId: undefined }))
  }

  const regenerarCodigo = () => setCodigo(generarCodigoFicha(fichasApi))

  // Copia el código para compartirlo con los aprendices.
  async function copiarCodigo(valor) {
    try {
      await navigator.clipboard.writeText(valor)
    } catch {
      try {
        const campo = document.createElement('textarea')
        campo.value = valor
        campo.setAttribute('readonly', '')
        campo.style.position = 'absolute'
        campo.style.left = '-9999px'
        document.body.appendChild(campo)
        campo.select()
        document.execCommand('copy')
        document.body.removeChild(campo)
      } catch {
        return
      }
    }
    setCopiado(valor)
    setTimeout(() => setCopiado((actual) => (actual === valor ? null : actual)), 1800)
  }

  // Programas pertenecientes a la red seleccionada.
  const programasDeRed = programasApi.filter(
    (p) => Number(p.knowledge_network_id) === Number(form.red)
  )

  const validar = () => {
    const err = {}
    if (!form.red) err.red = 'Selecciona la red de conocimiento.'
    if (!form.programaId) err.programaId = 'Selecciona el programa de formación.'
    if (!form.nombre.trim()) err.nombre = 'El nombre de la ficha es obligatorio.'
    const numero = form.numero.trim()
    if (!numero) {
      err.numero = 'El número de ficha es obligatorio.'
    } else if (!/^\d{4,8}$/.test(numero)) {
      err.numero = 'Solo dígitos (4 a 8 caracteres).'
    }
    return err
  }

  const crearEnApi = async (codigoUsado) => fichas.crear({
    codigo: codigoUsado,
    numero: form.numero.trim(),
    nombre: form.nombre.trim(),
    estado: 'activo',
    id_programa: Number(form.programaId),
    id_instructor: Number(miFila.id),
  })

  const onSubmit = async (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    if (!miFila) {
      setErrores({ numero: 'No se encontró tu perfil de instructor para asignar la ficha.' })
      return
    }
    setGuardando(true)
    let codigoEfectivo = codigo
    try {
      try {
        await crearEnApi(codigoEfectivo)
      } catch (error) {
        const campos = toFieldErrors(error?.data)
        // El código es único: si choca, se regenera y se reintenta una vez.
        if (campos.codigo) {
          codigoEfectivo = generarCodigoFicha(fichasApi)
          setCodigo(codigoEfectivo)
          await crearEnApi(codigoEfectivo)
        } else if (campos.id_programa || campos.programa) {
          setErrores({ programaId: 'El programa no existe en el servidor.' })
          return
        } else if (campos.numero) {
          setErrores({ numero: campos.numero })
          return
        } else {
          setErrores({ numero: error?.data?.message || 'No se pudo crear la ficha. Intenta de nuevo.' })
          return
        }
      }
      setForm({ red: '', programaId: '', nombre: '', numero: '' })
      setErrores({})
      setCodigo(generarCodigoFicha(fichasApi))
      setCreando(false)
      await recargar()
      mostrarCreada()
    } finally {
      setGuardando(false)
    }
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
          breadcrumb={
            creando
              ? [
                  { label: 'Dashboard', to: '/instructor/dashboard', icon: <ChartBar size={14} /> },
                  { label: 'Fichas', icon: <Books size={14} />, onClick: () => setCreando(false) },
                  { label: 'Nueva ficha' },
                ]
              : []
          }
          onBack={creando ? () => setCreando(false) : undefined}
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
              <div className={c.grid2}>
                <FormField label="Red de conocimiento" required error={errores.red}>
                  <Select name="red" value={form.red} onChange={alCambiarRed}>
                    <option value="">Selecciona una red…</option>
                    {redesApi.map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.nombre}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Programa de formación" required error={errores.programaId}>
                  <Select name="programaId" value={form.programaId} onChange={onChange} disabled={!form.red}>
                    <option value="">{form.red ? 'Selecciona un programa…' : 'Elige primero la red…'}</option>
                    {programasDeRed.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.nombre}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <FormField label="Nombre de la ficha" required error={errores.nombre}>
                <Input
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  placeholder="Ej. Análisis y Desarrollo 2718"
                  maxLength={MAX_NOMBRE}
                />
              </FormField>

              <FormField label="Número de ficha" required error={errores.numero} help="Solo dígitos, sin espacios. Ej. 3142101">
                <Input
                  name="numero"
                  inputMode="numeric"
                  value={form.numero}
                  onChange={onChange}
                  placeholder="Ej. 3142101"
                  maxLength={MAX_NUMERO_FICHA}
                />
              </FormField>

              <FormField
                label="Código de la ficha"
                help="Código único que compartes con tus aprendices para que se unan a la ficha."
              >
                <div className={c.codigoRow}>
                  <code className={c.codigo}>{codigo}</code>
                  <Button type="button" variant="ghost" onClick={regenerarCodigo}>
                    <ArrowClockwise size={14} /> Regenerar
                  </Button>
                </div>
              </FormField>

              <Actions form>
                <Button type="submit" disabled={guardando}>
                  <CheckCircle size={14} /> {guardando ? 'Creando…' : 'Crear ficha'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setCreando(false)}>
                  Cancelar
                </Button>
              </Actions>
            </form>
          </DataPanel>
        ) : (
          <>
            {creadaMsg && (
              <Alert>
                <CheckCircle size={14} /> Ficha creada correctamente.
              </Alert>
            )}

            {accionMsg && (
              <Alert variant="danger">
                <Warning size={14} /> {accionMsg}
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
                  placeholder="Nombre, código, número o programa…"
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
                  <option value="finalizado">Finalizado</option>
                </Select>
              </label>
              <label className={s.field}>
                <span className={s.label}>Red</span>
                <Select
                  value={filtroRed}
                  onChange={(e) => {
                    setFiltroRed(e.target.value)
                    setPagina(1)
                  }}
                >
                  <option value="todos">Todas</option>
                  {redesApi.map((r) => (
                    <option key={r.id} value={String(r.id)}>{r.nombre}</option>
                  ))}
                </Select>
              </label>
              <p className={s.info}>
                {filtradas.length} ficha{filtradas.length !== 1 ? 's' : ''}
              </p>
            </FilterBar>

            <ApiState cargando={cargando} error={error} onReintentar={recargar}>
              {paginadas.length === 0 ? (
                <EmptyState
                  icon={<Books />}
                  title="No hay fichas"
                  message={
                    fichasPropias.length === 0
                      ? 'Aún no se han creado fichas de formación. Crea la primera.'
                      : 'Ninguna ficha coincide con los filtros aplicados.'
                  }
                  actionLabel={fichasPropias.length === 0 ? 'Crear primera ficha' : undefined}
                  onAction={fichasPropias.length === 0 ? abrirCreacion : undefined}
                />
              ) : (
                <>
                  <div className={s.cardGrid}>
                    {paginadas.map((f) => {
                      const estudiantes = aprendicesApi.filter((a) => Number(a.id_class_group) === Number(f.id)).length
                      const props = todosProyectos.filter((p) => Number(p.id_class_group) === Number(f.id))
                      const pend = props.filter((p) => p.estado === 'pendiente').length
                      const bloqueada = estudiantes > 0 || props.length > 0
                      return (
                        <article key={f.id} className={s.card}>
                          <header className={s.cardHeader}>
                            <span className={s.codigoWrap}>
                              <code className={s.codigo}>{f.codigo}</code>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => copiarCodigo(f.codigo)}
                                aria-label={`Copiar código ${f.codigo}`}
                              >
                                <Copy size={14} />
                                {copiado === f.codigo ? 'Copiado' : 'Copiar'}
                              </Button>
                            </span>
                            <Badge variant={FICHA_ESTADO_VARIANT[f.estado] || 'neutral'}>
                              {ESTADO_LABEL[f.estado] || f.estado}
                            </Badge>
                          </header>
                          <Link to={`/instructor/detalle-ficha/${f.id}`} viewTransition className={s.cardTitle}>
                            {f.nombre}
                          </Link>
                          <p className={s.cardMeta}>N° {f.numero} · {f.program?.nombre || 'Sin programa'}</p>
                          <div className={s.cohorteBar} role="img" aria-label={`${pend} de ${props.length} propuestas por revisar`}>
                            <span className={s.cohorteFill} style={{ width: props.length === 0 ? '0%' : `${Math.round(((props.length - pend) / props.length) * 100)}%` }} />
                          </div>
                          <p className={s.cardMeta}>
                            {estudiantes} aprendices · {props.length} propuestas · {pend} por revisar
                          </p>
                          <footer className={s.cardFooter}>
                            <Button
                              as="link"
                              to={`/instructor/detalle-ficha/${f.id}`}
                              viewTransition
                              size="sm"
                              variant="secondary"
                            >
                              <Eye size={14} /> Ver
                            </Button>
                            <span className={s.accionCol}>
                              <Button
                                type="button"
                                size="sm"
                                variant="danger"
                                disabled={bloqueada}
                                aria-describedby={bloqueada ? `motivo-ficha-ins-${f.id}` : undefined}
                                title={bloqueada ? 'No se puede eliminar: tiene aprendices o propuestas asociadas' : undefined}
                                onClick={() => setAEliminar(f)}
                              >
                                <Trash size={14} /> Eliminar
                              </Button>
                              {bloqueada && (
                                <MotivoBloqueo compact id={`motivo-ficha-ins-${f.id}`}>
                                  Con datos · {estudiantes} aprendices · {props.length} propuestas
                                </MotivoBloqueo>
                              )}
                            </span>
                          </footer>
                        </article>
                      )
                    })}
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
            </ApiState>
          </>
        )}
      </div>

      <ConfirmModal
        open={!!aEliminar}
        titulo="Eliminar ficha"
        mensaje={
          aEliminar
                ? `¿Seguro que deseas eliminar la ficha "${aEliminar.nombre}" (${aEliminar.codigo})? Solo se permite si no tiene aprendices ni propuestas. Esta acción no se puede deshacer.`
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
