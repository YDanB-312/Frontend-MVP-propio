import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FormField from '../../../components/FormField/FormField'
import { useAuth } from '../../../contexts/AuthContext'
import { getAllFichas, findFichaById, findUserById, createProject } from '../../../data/mockData'
import s from './NuevoProyecto.module.css'

const AREAS = [
  'Desarrollo Web',
  'Inteligencia Artificial',
  'Ciencia de Datos',
  'Ciberseguridad',
  'Otro',
]

export default function NuevoProyecto() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const fichas = useMemo(() => getAllFichas().filter((f) => f.estado === 'activo'), [])
  const perfil = findUserById(user.id)

  const [form, setForm] = useState({
    title: '',
    description: '',
    objetivoGeneral: '',
    objetivosEspecificos: '',
    areaAplicacion: '',
    keywords: '',
    fichaId: perfil?.fichaId ? String(perfil.fichaId) : '',
  })
  const [errors, setErrors] = useState({})
  const [guardando, setGuardando] = useState(false)

  const objetivosValidos = useMemo(
    () =>
      form.objetivosEspecificos
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [form.objetivosEspecificos]
  )

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrors((e) => ({ ...e, [campo]: undefined }))
  }

  function validar() {
    const errs = {}
    if (form.title.trim().length < 5) errs.title = 'El nombre debe tener al menos 5 caracteres.'
    if (form.description.trim().length < 20) {
      errs.description = 'La descripción debe tener al menos 20 caracteres.'
    }
    if (form.objetivoGeneral.trim().length < 15) {
      errs.objetivoGeneral = 'El objetivo general debe tener al menos 15 caracteres.'
    }
    if (objetivosValidos.length < 2) {
      errs.objetivosEspecificos = 'Escribe al menos 2 objetivos específicos (uno por línea).'
    } else if (objetivosValidos.some((o) => o.length < 8)) {
      errs.objetivosEspecificos = 'Cada objetivo específico debe tener al menos 8 caracteres.'
    }
    if (!form.areaAplicacion) errs.areaAplicacion = 'Selecciona un área de aplicación.'
    if (!form.fichaId) errs.fichaId = 'Selecciona tu ficha de formación.'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validar()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const ficha = findFichaById(form.fichaId)
    if (!ficha) {
      setErrors({ fichaId: 'La ficha seleccionada no existe.' })
      return
    }

    setGuardando(true)
    const project = createProject({
      title: form.title.trim(),
      description: form.description.trim(),
      studentId: user.id,
      studentName: user.nombre,
      instructorId: ficha.instructorId,
      instructorName: ficha.instructorName,
      fichaId: ficha.id,
      keywords: form.keywords.trim(),
      objetivoGeneral: form.objetivoGeneral.trim(),
      objetivosEspecificos: objetivosValidos.join('\n'),
      areaAplicacion: form.areaAplicacion,
      integrantes: [user.nombre],
      estado: 'pendiente',
    })
    navigate('/aprendiz/analizando-proyecto', { state: { projectId: project.id }, replace: true })
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Nueva Propuesta">
      <div className={s.wrapper}>
        <PageHeader
          title="Nueva Propuesta"
          subtitle="Registra tu idea: una solución de software para un problema concreto. No necesitas definir tecnologías ni entregables todavía."
          icon={<Plus />}
          breadcrumb={[
            { label: 'Dashboard', to: '/aprendiz/dashboard' },
            { label: 'Mis Proyectos', to: '/aprendiz/mis-proyectos' },
            { label: 'Nueva Propuesta' },
          ]}
        />

        <form className={s.form} onSubmit={handleSubmit} noValidate>
          <FormField label="Nombre de la propuesta" error={errors.title} required>
            <input
              type="text"
              className={s.input}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Sistema de monitoreo ambiental con IoT"
              maxLength={120}
              autoFocus
            />
          </FormField>

          <FormField
            label="Descripción del problema y la solución"
            error={errors.description}
            help={`${form.description.length}/600 caracteres`}
            required
          >
            <textarea
              className={s.textarea}
              rows={5}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="¿Qué problema quieres resolver? ¿Cómo lo resolvería tu software? ¿Quiénes se beneficiarían?"
              maxLength={600}
            />
          </FormField>

          <FormField
            label="Objetivo general"
            error={errors.objetivoGeneral}
            help="Qué quieres lograr con la solución, en una sola frase."
            required
          >
            <textarea
              className={s.textarea}
              rows={3}
              value={form.objetivoGeneral}
              onChange={(e) => set('objetivoGeneral', e.target.value)}
              placeholder="Ej: Optimizar el riego de cultivos pequeños mediante monitoreo automatizado de humedad del suelo."
              maxLength={300}
            />
          </FormField>

          <FormField
            label="Objetivos específicos"
            error={errors.objetivosEspecificos}
            help={`Un objetivo por línea (mínimo 2). Usa verbos como Implementar, Diseñar, Evaluar. Llevas ${objetivosValidos.length}.`}
            required
          >
            <textarea
              className={s.textarea}
              rows={5}
              value={form.objetivosEspecificos}
              onChange={(e) => set('objetivosEspecificos', e.target.value)}
              placeholder={'Implementar sensores de humedad en el cultivo.\nDiseñar un panel web para visualizar los datos.\nEvaluar el ahorro de agua durante un mes.'}
            />
          </FormField>

          <div className={s.grid2}>
            <FormField label="Área de aplicación" error={errors.areaAplicacion} required>
              <select
                className={s.select}
                value={form.areaAplicacion}
                onChange={(e) => set('areaAplicacion', e.target.value)}
              >
                <option value="">Selecciona un área...</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Ficha de formación" error={errors.fichaId} required>
              <select
                className={s.select}
                value={form.fichaId}
                onChange={(e) => set('fichaId', e.target.value)}
              >
                <option value="">Selecciona tu ficha...</option>
                {fichas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre} · {f.codigo}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField
            label="Palabras clave"
            help="Opcional. Si aún no las tienes claras, puedes agregarlas después."
          >
            <input
              type="text"
              className={s.input}
              value={form.keywords}
              onChange={(e) => set('keywords', e.target.value)}
              placeholder="iot, sensores, agricultura"
            />
          </FormField>

          <div className={s.actions}>
            <button type="submit" className={`${s.btn} ${s.primary}`} disabled={guardando}>
              {guardando ? 'Enviando...' : 'Enviar propuesta y analizar'}
            </button>
            <Link to="/aprendiz/mis-proyectos" className={`${s.btn} ${s.secondary}`}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
