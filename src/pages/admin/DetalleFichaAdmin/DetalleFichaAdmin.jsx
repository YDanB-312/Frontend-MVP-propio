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
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import InformacionFicha from '../../../components/DetalleFichaBase/InformacionFicha'
import {
  findFichaById,
  getEstudiantesDeFicha,
  getProjectsByFicha,
  getAllUsers,
  findUserById,
  getCentros,
  updateFicha,
  deleteFicha,
  REDES,
  displayNames,
} from '../../../data/mockData'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import s from '../../../components/DetalleFichaBase/DetalleFichaBase.module.css'
import { Books, ChartBar, CheckCircle, FolderOpen, GraduationCap, IdentificationCard, MagnifyingGlass, PencilLine, Trash } from 'phosphor-react'

const ESTADOS_FICHA = ['activo', 'inactivo', 'finalizado', 'archivado']

export default function DetalleFichaAdmin() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState(() => {
    const f = findFichaById(id)
    return f
      ? {
          nombre: f.nombre,
          numero: f.numero || '',
          estado: f.estado || 'activo',
          red: '',
          programa: f.programa || '',
          centroId: f.centroId ? String(f.centroId) : '',
          instructorId: f.instructorId ? String(f.instructorId) : '',
        }
      : null
  })
  const [errores, setErrores] = useState({})
  const [guardado, setGuardado] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)

  const ficha = findFichaById(id)
  const estudiantes = ficha ? getEstudiantesDeFicha(ficha.id) : []
  const proyectos = ficha ? getProjectsByFicha(ficha.id) : []
  const instructores = getAllUsers().filter((u) => u.role === 'instructor' && u.estado !== 'suspendido')
  const centros = getCentros()
  const tieneDatos = estudiantes.length > 0 || proyectos.length > 0

  // Sincroniza el formulario al navegar entre fichas sin remontar
  useEffect(() => {
    if (ficha) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nombre: ficha.nombre,
        numero: ficha.numero || '',
        estado: ficha.estado || 'activo',
        red: '',
        programa: ficha.programa || '',
        centroId: ficha.centroId ? String(ficha.centroId) : '',
        instructorId: ficha.instructorId ? String(ficha.instructorId) : '',
      })
      setEditando(false)
      setGuardado(false)
    }
  }, [ficha?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ficha) {
    return (
      <DashboardLayout role="admin" titulo="Detalle de Ficha">
        <div className={s.page}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Ficha no encontrada"
            message="La ficha que buscas no existe o fue eliminada."
            actionLabel="Volver a fichas"
            onAction={() => navigate('/admin/fichas')}
          />
        </div>
      </DashboardLayout>
    )
  }

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

  const programasDeRed = form.red
    ? (REDES.find((r) => r.nombre === form.red)?.programas || [])
    : [...new Set(REDES.flatMap((r) => r.programas))].sort()

  const validar = () => {
    const err = {}
    if (!form.nombre.trim()) err.nombre = 'El nombre es obligatorio.'
    if (!form.numero.trim()) err.numero = 'El número de ficha es obligatorio.'
    else if (!/^\d{4,8}$/.test(form.numero.trim())) err.numero = 'Solo dígitos (4 a 8 caracteres).'
    if (!form.programa) err.programa = 'Selecciona el programa de formación.'
    return err
  }

  const guardarEdicion = (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    const instructor = instructores.find((i) => String(i.id) === String(form.instructorId))
    updateFicha({
      id: ficha.id,
      nombre: form.nombre.trim(),
      numero: form.numero.trim(),
      estado: form.estado,
      programa: form.programa,
      centroId: form.centroId === '' ? null : Number(form.centroId),
      instructorName: form.instructorId === '' ? '' : instructor?.name || ficha.instructorName,
      instructorId: form.instructorId === '' ? null : Number(form.instructorId),
    })
    setEditando(false)
    setGuardado(true)
  }

  const cancelarEdicion = () => {
    setEditando(false)
    setErrores({})
    setForm({
      nombre: ficha.nombre,
      numero: ficha.numero || '',
      estado: ficha.estado || 'activo',
      red: '',
      programa: ficha.programa || '',
      centroId: ficha.centroId ? String(ficha.centroId) : '',
      instructorId: ficha.instructorId ? String(ficha.instructorId) : '',
    })
  }

  const confirmarEliminar = () => {
    deleteFicha(ficha.id)
    navigate('/admin/fichas')
  }

  return (
    <DashboardLayout role="admin" titulo="Detalle de Ficha">
      <div className={s.page}>
        <PageHeader
          title={ficha.nombre}
          subtitle={`Código ${ficha.codigo} · N° ${ficha.numero} · ${ficha.programa}`}
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
                disabled={tieneDatos}
                title={tieneDatos ? 'No se puede eliminar: tiene aprendices o propuestas asociadas' : undefined}
                onClick={() => setModalEliminar(true)}
              >
                <Trash size={14} /> Eliminar ficha
              </Button>
            </div>
          }
        >
          {!editando ? (
            <InformacionFicha
              ficha={ficha}
              estudiantesCount={estudiantes.length}
              proyectosCount={proyectos.length}
              instructorHref={ficha.instructorId ? `/admin/detalle-usuario/${ficha.instructorId}` : null}
            />
          ) : (
            <form className={s.form} onSubmit={guardarEdicion} noValidate>
              <FormField label="Nombre de la ficha" required error={errores.nombre}>
                <Input
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  maxLength={80}
                />
              </FormField>
              <FormField label="Número de ficha" required error={errores.numero} help="Solo dígitos, sin espacios. Ej. 3142101">
                <Input
                  name="numero"
                  inputMode="numeric"
                  value={form.numero}
                  onChange={onChange}
                  maxLength={8}
                />
              </FormField>
              <FormField label="Red de conocimiento" help="Solo para cambiar el programa.">
                <Select name="red" value={form.red} onChange={alCambiarRed}>
                  <option value="">Mantener programa actual…</option>
                  {REDES.map((r) => (
                    <option key={r.nombre} value={r.nombre}>
                      {r.nombre}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Programa de formación" required error={errores.programa}>
                <Select name="programa" value={form.programa} onChange={onChange} disabled={!!form.red && programasDeRed.length === 0}>
                  {programasDeRed.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Centro de formación">
                <Select name="centroId" value={form.centroId} onChange={onChange}>
                  <option value="">Sin centro</option>
                  {centros.map((ct) => (
                    <option key={ct.id} value={String(ct.id)}>
                      {ct.nombre}{ct.ciudad ? ` · ${ct.ciudad}` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Instructor a cargo">
                <Select name="instructorId" value={form.instructorId} onChange={onChange}>
                  <option value="">Sin asignar</option>
                  {instructores.map((i) => (
                    <option key={i.id} value={String(i.id)}>
                      {i.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Estado" help="Archivar cierra la ficha: conserva el historial y bloquea nuevas uniones.">
                <Select name="estado" value={form.estado} onChange={onChange}>
                  {ESTADOS_FICHA.map((est) => (
                    <option key={est} value={est}>
                      {displayNames.classGroupStatus[est] || est}
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
          {estudiantes.length === 0 ? (
            <p className={s.muted}>Aún no hay aprendices en esta ficha.</p>
          ) : (
            <ul className={s.studentList}>
              {estudiantes.map((est) => {
                const perfil = findUserById(est.id)
                return (
                  <li key={est.id}>
                    <Link to={`/admin/detalle-usuario/${est.id}`} viewTransition className={s.studentRow}>
                      <Avatar name={est.name} src={perfil?.fotoPerfil} size="md" />
                      <span className={s.studentInfo}>
                        <span className={s.studentName}>{est.name}</span>
                        <span className={s.studentEmail}>{est.email}</span>
                      </span>
                      <span className={s.arrow} aria-hidden="true">→</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </DataPanel>

        <DataPanel title={`Propuestas (${proyectos.length})`} icon={<FolderOpen />}>
          {proyectos.length === 0 ? (
            <p className={s.muted}>Esta ficha aún no tiene propuestas asociadas.</p>
          ) : (
            <ul className={s.studentList}>
              {proyectos.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/detalle-proyecto/${p.id}`} viewTransition className={s.studentRow}>
                    <span className={s.studentInfo}>
                      <span className={s.studentName}>{p.title}</span>
                      <span className={s.studentEmail}>{p.studentName} · {p.createdAt}</span>
                    </span>
                    <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>
                      {displayNames.projectStatus[p.estado] || p.estado}
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
        mensaje={`¿Seguro que deseas eliminar la ficha "${ficha.nombre}" (${ficha.codigo})? Los aprendices asignados quedarán sin ficha. Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setModalEliminar(false)}
      />
    </DashboardLayout>
  )
}
