import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import Avatar from '../../../components/Avatar/Avatar'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import FormField from '../../../components/FormField/FormField'
import {
  findFichaById,
  getEstudiantesDeFicha,
  updateFicha,
  deleteFicha,
  displayNames,
} from '../../../data/mockData'
import s from './DetalleFichaInstructor.module.css'
import { ArrowRight, Books, ChartBar, CheckCircle, Code, GraduationCap, IdentificationCard, MagnifyingGlass, PencilLine, Trash, Users } from 'phosphor-react'

const PROGRAMAS = [
  'ADSO',
  'Produccion Multimedia',
  'Infraestructura Redes',
  'Contabilidad y Finanzas',
  'Otro',
]

export default function DetalleFichaInstructor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState(() => {
    const f = findFichaById(id)
    return f ? { nombre: f.nombre, programa: f.programa || '', estado: f.estado || 'activo' } : null
  })
  const [errores, setErrores] = useState({})
  const [modalEliminar, setModalEliminar] = useState(false)

  const ficha = findFichaById(id)
  const estudiantes = ficha ? getEstudiantesDeFicha(ficha.id) : []

  if (!ficha) {
    return (
      <DashboardLayout role="instructor" titulo="Detalle de Ficha">
        <div className={s.page}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Ficha no encontrada"
            message="La ficha que buscas no existe o fue eliminada."
            actionLabel="Volver a gestionar fichas"
            onAction={() => navigate('/instructor/gestionar-fichas')}
          />
        </div>
      </DashboardLayout>
    )
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((err) => ({ ...err, [name]: undefined }))
  }

  const guardarEdicion = (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setErrores({ nombre: 'El nombre es obligatorio.' })
      return
    }
    updateFicha({
      id: ficha.id,
      nombre: form.nombre.trim(),
      programa: form.programa,
      estado: form.estado,
    })
    setEditando(false)
  }

  const confirmarEliminar = () => {
    deleteFicha(ficha.id)
    navigate('/instructor/gestionar-fichas')
  }

  return (
    <DashboardLayout role="instructor" titulo="Detalle de Ficha">
      <div className={s.page}>
        <PageHeader
          title={ficha.nombre}
          subtitle={`Código ${ficha.codigo} · Creada el ${ficha.createdAt}`}
          icon={<Books />}
          breadcrumb={[
            { label: 'Dashboard', to: '/instructor/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Gestionar Fichas', to: '/instructor/gestionar-fichas', icon: <Books size={14} /> },
            { label: ficha.nombre },
          ]}
        />

        <DataPanel
          title="Información de la ficha"
          icon={<IdentificationCard />}
          action={
            <div className={s.headActions}>
              <button
                type="button"
                className={`${s.btn} ${s.secondary}`}
                onClick={() => setEditando((v) => !v)}
              >
                <PencilLine size={14} /> {editando ? 'Cancelar edición' : 'Editar'}
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.danger}`}
                onClick={() => setModalEliminar(true)}
              >
                <Trash size={14} /> Eliminar ficha
              </button>
            </div>
          }
        >
          {!editando ? (
            <>
              <dl className={s.grid}>
                <div className={s.cell}>
                  <dt>Código</dt>
                  <dd>
                    <code className={s.codigo}>{ficha.codigo}</code>
                  </dd>
                </div>
                <div className={s.cell}>
                  <dt>Programa</dt>
                  <dd>{ficha.programa || '—'}</dd>
                </div>
                <div className={s.cell}>
                  <dt>Instructor</dt>
                  <dd>{ficha.instructorName || 'Sin asignar'}</dd>
                </div>
                <div className={s.cell}>
                  <dt>Estado</dt>
                  <dd>
                    <Badge variant={ficha.estado === 'activo' ? 'success' : 'neutral'}>
                      {displayNames.classGroupStatus[ficha.estado] || ficha.estado}
                    </Badge>
                  </dd>
                </div>
                <div className={s.cell}>
                  <dt>Aprendices</dt>
                  <dd>{estudiantes.length}</dd>
                </div>
                <div className={s.cell}>
                  <dt>Proyectos asociados</dt>
                  <dd>{ficha.proyectos}</dd>
                </div>
              </dl>
              <Link
                to={`/instructor/directorio-ficha/${ficha.id}`}
                className={`${s.btn} ${s.primary} ${s.directorioBtn}`}
              >
                <Users size={14} /> Ver directorio de aprendices <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <form className={s.form} onSubmit={guardarEdicion} noValidate>
              <FormField label="Nombre de la ficha" required error={errores.nombre}>
                <input
                  className={s.input}
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  maxLength={80}
                />
              </FormField>
              <FormField label="Programa">
                <select
                  className={s.select}
                  name="programa"
                  value={form.programa}
                  onChange={onChange}
                >
                  <option value="">Sin programa</option>
                  {PROGRAMAS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Estado">
                <select
                  className={s.select}
                  name="estado"
                  value={form.estado}
                  onChange={onChange}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </FormField>
              <div className={s.formActions}>
                <button type="submit" className={`${s.btn} ${s.primary}`}>
                  <CheckCircle size={14} /> Guardar cambios
                </button>
                <button
                  type="button"
                  className={`${s.btn} ${s.secondary}`}
                  onClick={() => {
                    setEditando(false)
                    setForm({
                      nombre: ficha.nombre,
                      programa: ficha.programa || '',
                      estado: ficha.estado || 'activo',
                    })
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </DataPanel>

        <DataPanel title={`Aprendices (${estudiantes.length})`} icon={<GraduationCap />}>
          {estudiantes.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title="Sin aprendices"
              message="Los aprendices que se unan con el código de la ficha aparecerán aquí."
            />
          ) : (
            <ul className={s.studentList}>
              {estudiantes.map((est) => (
                <li key={est.id}>
                  <Link to={`/instructor/perfil-companero/${est.id}`} className={s.studentRow}>
                    <Avatar name={est.name} size="md" />
                    <span className={s.studentInfo}>
                      <span className={s.studentName}>{est.name}</span>
                      <span className={s.studentEmail}>{est.email}</span>
                    </span>
                    <span className={s.arrow} aria-hidden="true"><ArrowRight size={22} /></span>
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
        mensaje={`¿Seguro que deseas eliminar la ficha "${ficha.nombre}" (${ficha.codigo})? Los aprendices quedarán sin ficha. Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setModalEliminar(false)}
      />
    </DashboardLayout>
  )
}
