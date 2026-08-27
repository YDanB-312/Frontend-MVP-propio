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
import Actions from '../../../components/Actions/Actions'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findFichaById,
  getEstudiantesDeFicha,
  updateFicha,
  deleteFicha,
  instructorVeFicha,
  getRedDePrograma,
  displayNames,
} from '../../../data/mockData'
import s from '../../../components/DetalleFichaBase/DetalleFichaBase.module.css'
import { ArrowRight, Books, ChartBar, CheckCircle, Code, GraduationCap, IdentificationCard, LockKey, MagnifyingGlass, PencilLine, Trash, Users } from 'phosphor-react'

export default function DetalleFichaInstructor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState(() => {
    const f = findFichaById(id)
    return f ? { nombre: f.nombre, numero: f.numero || '', estado: f.estado || 'activo' } : null
  })
  const [errores, setErrores] = useState({})
  const [modalEliminar, setModalEliminar] = useState(false)

  const ficha = findFichaById(id)
  const estudiantes = ficha ? getEstudiantesDeFicha(ficha.id) : []

  // Autorización: solo el instructor a cargo de la ficha
  const autorizado = ficha && instructorVeFicha(ficha, user?.id)

  if (!ficha) {
    return (
      <DashboardLayout role="instructor" titulo="Detalle de Ficha">
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
      <DashboardLayout role="instructor" titulo="Detalle de Ficha">
        <div className={s.page}>
          <EmptyState
            icon={<LockKey size={40} weight="light" />}
            title="Esta ficha no está a tu cargo"
            message="Pertenece a otro instructor. Solo puedes gestionar las fichas que tú creaste."
            actionLabel="Volver al dashboard"
            onAction={() => navigate('/instructor/dashboard')}
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
    const numero = form.numero.trim()
    if (!form.nombre.trim()) {
      setErrores({ nombre: 'El nombre es obligatorio.' })
      return
    }
    if (!numero) {
      setErrores({ numero: 'El número de ficha es obligatorio.' })
      return
    }
    if (!/^\d{4,8}$/.test(numero)) {
      setErrores({ numero: 'Solo dígitos (4 a 8 caracteres).' })
      return
    }
    updateFicha({
      id: ficha.id,
      nombre: form.nombre.trim(),
      numero,
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
          subtitle={`Código ${ficha.codigo} · N° ${ficha.numero} · ${ficha.programa}`}
          icon={<Books />}
          breadcrumb={[
            { label: 'Dashboard', to: '/instructor/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Fichas', to: '/instructor/fichas', icon: <Books size={14} /> },
            { label: ficha.nombre },
          ]}
        />

        <DataPanel
          title="Información de la ficha"
          icon={<IdentificationCard />}
          action={
            <div className={s.headActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditando((v) => !v)}
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
          {!editando ? (
            <>
              <dl className={s.infoGridInstructor}>
                <div className={s.infoCell}>
                  <dt>Código</dt>
                  <dd>
                    <code className={s.codigo}>{ficha.codigo}</code>
                  </dd>
                </div>
                <div className={s.infoCell}>
                  <dt>Número de ficha</dt>
                  <dd>N° {ficha.numero}</dd>
                </div>
                <div className={s.infoCell}>
                  <dt>Red de conocimiento</dt>
                  <dd>{getRedDePrograma(ficha.programa) || '—'}</dd>
                </div>
                <div className={s.infoCell}>
                  <dt>Programa</dt>
                  <dd>{ficha.programa || '—'}</dd>
                </div>
                <div className={s.infoCell}>
                  <dt>Instructor</dt>
                  <dd>{ficha.instructorName || 'Sin asignar'}</dd>
                </div>
                <div className={s.infoCell}>
                  <dt>Estado</dt>
                  <dd>
                    <Badge variant={ficha.estado === 'activo' ? 'success' : 'neutral'}>
                      {displayNames.classGroupStatus[ficha.estado] || ficha.estado}
                    </Badge>
                  </dd>
                </div>
                <div className={s.infoCell}>
                  <dt>Aprendices</dt>
                  <dd>{estudiantes.length}</dd>
                </div>
                <div className={s.infoCell}>
                  <dt>Propuestas asociadas</dt>
                  <dd>{ficha.proyectos}</dd>
                </div>
              </dl>
              <Button
                as="link"
                to={`/instructor/directorio-ficha/${ficha.id}`}
                className={s.directorioBtn}
              >
                <Users size={14} /> Ver directorio de aprendices <ArrowRight size={14} />
              </Button>
            </>
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
              <FormField label="Estado">
                <Select
                  name="estado"
                  value={form.estado}
                  onChange={onChange}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="finalizado">Finalizado</option>
                </Select>
              </FormField>
              <Actions form>
                <Button type="submit">
                  <CheckCircle size={14} /> Guardar cambios
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditando(false)
                    setForm({
                      nombre: ficha.nombre,
                      numero: ficha.numero || '',
                      estado: ficha.estado || 'activo',
                    })
                  }}
                >
                  Cancelar
                </Button>
              </Actions>
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
                    <Avatar name={est.name} src={est.fotoPerfil} size="md" />
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
