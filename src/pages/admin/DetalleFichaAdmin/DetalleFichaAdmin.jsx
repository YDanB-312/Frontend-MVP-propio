import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import FormField from '../../../components/FormField/FormField'
import Badge from '../../../components/Badge/Badge'
import Alert from '../../../components/Alert/Alert'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import Actions from '../../../components/Actions/Actions'
import Avatar from '../../../components/Avatar/Avatar'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import InformacionFicha from '../../../components/DetalleFichaBase/InformacionFicha'
import { useApi } from '../../../lib/useApi'
import { fichas, programas, redes, instructores, proyectos } from '../../../lib/recursos'
import { toFieldErrors } from '../../../lib/api'
import { MAX_NOMBRE, MAX_NUMERO_FICHA } from '../../../utils/validation'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import { fechaDesdeApi } from '../../../utils/helpers'
import s from '../../../components/DetalleFichaBase/DetalleFichaBase.module.css'
import { Books, ChartBar, CheckCircle, FolderOpen, GraduationCap, IdentificationCard, MagnifyingGlass, PencilLine, Trash, Warning } from 'phosphor-react'

const ESTADOS_FICHA = ['activo', 'finalizado']
const ESTADO_LABEL = { activo: 'Activo', finalizado: 'Finalizado' }
const PROYECTO_ESTADO_LABEL = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

function formDesde(ficha) {
  if (!ficha) return null
  return {
    nombre: ficha.nombre || '',
    numero: ficha.numero || '',
    estado: ficha.estado || 'activo',
    red: ficha.program?.knowledge_network_id ? String(ficha.program.knowledge_network_id) : '',
    programa: ficha.id_programa ? String(ficha.id_programa) : '',
    instructorId: ficha.id_instructor ? String(ficha.id_instructor) : '',
  }
}

export default function DetalleFichaAdmin() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState(null)
  const [errores, setErrores] = useState({})
  const [guardado, setGuardado] = useState(false)
  const [accionMsg, setAccionMsg] = useState(null)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [busquedaAprendiz, setBusquedaAprendiz] = useState('')
  const [filtroPropFicha, setFiltroPropFicha] = useState('todos')

  // Fuente única: la API. Ficha con relaciones + catálogos + propuestas.
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [ficha, listaProgramas, listaRedes, listaInstructores, listaProyectos] = await Promise.all([
        fichas.obtener(id),
        programas.listar(),
        redes.listar(),
        instructores.listar('generalUser'),
        proyectos.listar(),
      ])
      return { ficha, listaProgramas, listaRedes, listaInstructores, listaProyectos }
    },
    [id],
    { inicial: null }
  )

  const ficha = data?.ficha || null

  // Sincroniza el formulario al navegar entre fichas o recargar.
  useEffect(() => {
    if (ficha) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(formDesde(ficha))
      setEditando(false)
      setGuardado(false)
    }
  }, [ficha?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (cargando || error || !ficha) {
    return (
      <DashboardLayout role="admin" titulo="Detalle de Ficha">
        <div className={s.page}>
          {error ? (
            <EmptyState
              icon={<MagnifyingGlass />}
              title="No se pudo cargar la ficha"
              message={error.message || 'Ocurrió un error al consultar la API.'}
              actionLabel="Reintentar"
              onAction={recargar}
            />
          ) : cargando ? (
            <ApiState cargando error={null} />
          ) : (
            <EmptyState
              icon={<MagnifyingGlass />}
              title="Ficha no encontrada"
              message="La ficha que buscas no existe o fue eliminada."
              actionLabel="Volver a fichas"
              onAction={() => navigate('/admin/fichas')}
            />
          )}
        </div>
      </DashboardLayout>
    )
  }

  const listaProgramas = data.listaProgramas || []
  const listaRedes = data.listaRedes || []
  const listaInstructores = data.listaInstructores || []

  const estudiantes = ficha.apprentices || []
  const proyectosDeLaFicha = (data.listaProyectos || []).filter((p) => Number(p.id_class_group) === Number(ficha.id))

  const estudiantesFiltrados = estudiantes.filter((est) => {
    const q = busquedaAprendiz.trim().toLowerCase()
    if (!q) return true
    const g = est.generalUser || {}
    return nombreCompleto(g).toLowerCase().includes(q) || (g.correo || '').toLowerCase().includes(q)
  })
  const proyectosFiltradosFicha = proyectosDeLaFicha.filter(
    (p) => filtroPropFicha === 'todos' || p.estado === filtroPropFicha
  )
  const instructoresActivos = listaInstructores.filter((i) => i.generalUser?.estado !== false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((err) => ({ ...err, [name]: undefined }))
    setGuardado(false)
  }

  function alCambiarRed(e) {
    const { value } = e.target
    setForm((f) => ({ ...f, red: value, programa: '' }))
    setErrores((err) => ({ ...err, red: undefined, programa: undefined }))
    setGuardado(false)
  }

  const programasDeRed = form?.red
    ? listaProgramas.filter((p) => Number(p.knowledge_network_id) === Number(form.red))
    : listaProgramas

  const validar = () => {
    const err = {}
    if (!form.nombre.trim()) err.nombre = 'El nombre es obligatorio.'
    if (!form.numero.trim()) err.numero = 'El número de ficha es obligatorio.'
    else if (!/^\d{4,8}$/.test(form.numero.trim())) err.numero = 'Solo dígitos (4 a 8 caracteres).'
    if (!form.programa) err.programa = 'Selecciona el programa de formación.'
    return err
  }

  const guardarEdicion = async (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    try {
      await fichas.actualizar(ficha.id, {
        codigo: ficha.codigo,
        nombre: form.nombre.trim(),
        numero: form.numero.trim(),
        estado: form.estado,
        id_programa: Number(form.programa),
        id_instructor: form.instructorId === '' ? null : Number(form.instructorId),
      })
      await recargar()
      setEditando(false)
      setGuardado(true)
    } catch (error2) {
      const campos = toFieldErrors(error2?.data)
      if (campos.id_programa) {
        setErrores({ programa: 'El programa no existe en el servidor.' })
        return
      }
      setErrores({ nombre: error2?.data?.message || 'No se pudo guardar la ficha en el servidor.' })
    }
  }

  const cancelarEdicion = () => {
    setEditando(false)
    setErrores({})
    setForm(formDesde(ficha))
  }

  const confirmarEliminar = async () => {
    try {
      await fichas.eliminar(ficha.id)
      navigate('/admin/fichas')
    } catch (err) {
      setModalEliminar(false)
      setAccionMsg(err?.data?.message || 'No se pudo eliminar la ficha.')
    }
  }


  return (
    <DashboardLayout role="admin" titulo="Detalle de Ficha">
      <div className={s.page}>
        <PageHeader
          title={ficha.nombre}
          subtitle={`Código ${ficha.codigo} · N° ${ficha.numero} · ${ficha.program?.nombre || 'Sin programa'}`}
          icon={<Books />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Fichas', to: '/admin/fichas', icon: <Books size={14} /> },
            { label: ficha.nombre },
          ]}
        />

        {guardado && (
          <Alert><CheckCircle size={14} /> Ficha actualizada correctamente.</Alert>
        )}

        {accionMsg && (
          <Alert variant="danger"><Warning size={14} /> {accionMsg}</Alert>
        )}

        <DataPanel
          title="Información de la ficha"
          icon={<IdentificationCard />}
          action={
            <div className={s.headActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => (editando ? cancelarEdicion() : setEditando(true))}
              >
                <PencilLine size={14} /> {editando ? 'Cancelar edición' : 'Editar'}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => setModalEliminar(true)}
              >
                <Trash size={14} /> Eliminar ficha
              </Button>
            </div>
          }
        >
          {!editando || !form ? (
            <InformacionFicha
              ficha={ficha}
              estudiantesCount={estudiantes.length}
              proyectosCount={proyectosDeLaFicha.length}
              instructorHref={ficha.instructor?.generalUser?.id ? `/admin/detalle-usuario/${ficha.instructor.generalUser.id}` : null}
            />
          ) : (
            <form className={s.form} onSubmit={guardarEdicion} noValidate>
              <FormField label="Nombre de la ficha" required error={errores.nombre}>
                <Input
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  maxLength={MAX_NOMBRE}
                />
              </FormField>
              <FormField label="Número de ficha" required error={errores.numero} help="Solo dígitos, sin espacios. Ej. 3142101">
                <Input
                  name="numero"
                  inputMode="numeric"
                  value={form.numero}
                  onChange={onChange}
                  maxLength={MAX_NUMERO_FICHA}
                />
              </FormField>
              <FormField label="Red de conocimiento" help="Solo para cambiar el programa.">
                <Select name="red" value={form.red} onChange={alCambiarRed}>
                  <option value="">Mantener programa actual…</option>
                  {listaRedes.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.nombre}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Programa de formación" required error={errores.programa}>
                <Select name="programa" value={form.programa} onChange={onChange}>
                  <option value="">Selecciona un programa…</option>
                  {programasDeRed.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Instructor a cargo">
                <Select name="instructorId" value={form.instructorId} onChange={onChange}>
                  <option value="">Sin asignar</option>
                  {instructoresActivos.map((i) => (
                    <option key={i.id} value={String(i.id)}>
                      {nombreCompleto(i.generalUser)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Estado" help="Archivar cierra la ficha: conserva el historial y bloquea nuevas uniones.">
                <Select name="estado" value={form.estado} onChange={onChange}>
                  {ESTADOS_FICHA.map((est) => (
                    <option key={est} value={est}>
                      {ESTADO_LABEL[est] || est}
                    </option>
                  ))}
                </Select>
              </FormField>
              <Actions form>
                <Button type="submit">
                  <CheckCircle size={14} /> Guardar cambios
                </Button>
                <Button type="button" variant="secondary" onClick={cancelarEdicion}>
                  Cancelar
                </Button>
              </Actions>
            </form>
          )}
        </DataPanel>

        <DataPanel title={`Aprendices (${estudiantes.length})`} icon={<GraduationCap />}>
          {estudiantes.length > 0 && (
            <FormField label="Buscar aprendiz">
              <Input
                value={busquedaAprendiz}
                onChange={(e) => setBusquedaAprendiz(e.target.value)}
                placeholder="Nombre o correo…"
              />
            </FormField>
          )}
          {estudiantes.length === 0 ? (
            <p className={s.muted}>Aún no hay aprendices en esta ficha.</p>
          ) : estudiantesFiltrados.length === 0 ? (
            <p className={s.muted}>Ningún aprendiz coincide con la búsqueda.</p>
          ) : (
            <ul className={s.studentList}>
              {estudiantesFiltrados.map((est) => {
                const perfil = est.generalUser || {}
                return (
                  <li key={est.id}>
                    <Link to={`/admin/detalle-usuario/${perfil.id}`} viewTransition className={s.studentRow}>
                      <Avatar name={nombreCompleto(perfil)} src={perfil.foto_url} size="md" />
                      <span className={s.studentInfo}>
                        <span className={s.studentName}>{nombreCompleto(perfil)}</span>
                        <span className={s.studentEmail}>{perfil.correo}</span>
                      </span>
                      <span className={s.arrow} aria-hidden="true">→</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </DataPanel>

        <DataPanel title={`Propuestas (${proyectosDeLaFicha.length})`} icon={<FolderOpen />}>
          {proyectosDeLaFicha.length > 0 && (
            <FormField label="Filtrar por estado">
              <Select value={filtroPropFicha} onChange={(e) => setFiltroPropFicha(e.target.value)}>
                <option value="todos">Todas</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </Select>
            </FormField>
          )}
          {proyectosDeLaFicha.length === 0 ? (
            <p className={s.muted}>Esta ficha aún no tiene propuestas asociadas.</p>
          ) : proyectosFiltradosFicha.length === 0 ? (
            <p className={s.muted}>Ninguna propuesta coincide con el estado seleccionado.</p>
          ) : (
            <ul className={s.studentList}>
              {proyectosFiltradosFicha.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/detalle-proyecto/${p.id}`} viewTransition className={s.studentRow}>
                    <span className={s.studentInfo}>
                      <span className={s.studentName}>{p.titulo}</span>
                      <span className={s.studentEmail}>{nombreCompleto(p.creator) || 'Sin autor'} · {fechaDesdeApi(p.created_at)}</span>
                    </span>
                    <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>
                      {PROYECTO_ESTADO_LABEL[p.estado] || p.estado}
                    </Badge>
                    <span className={s.arrow} aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DataPanel>
      </div>

      <ConfirmModal
        open={modalEliminar}
        titulo="Eliminar ficha"
        mensaje={`¿Seguro que deseas eliminar la ficha "${ficha.nombre}" (${ficha.codigo})? Se eliminarán también sus aprendices y propuestas (con sus similitudes y observaciones). Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        textoCancelar="Cancelar"
        responsabilidad
        verificacion="ELIMINAR"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setModalEliminar(false)}
      />
    </DashboardLayout>
  )
}
