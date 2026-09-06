import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import Actions from '../../../components/Actions/Actions'
import { Input, Select, Textarea } from '../../../components/Input/Input'
import FormField from '../../../components/FormField/FormField'
import { CalendarBlank, ChartBar, FolderOpen, GraduationCap, MagnifyingGlass, Plus, Tray } from 'phosphor-react'
import { useAuth } from '../../../contexts/AuthContext'
import {
  getProjectsByStudent,
  getSimilitudesValidas,
  getEstudiantesDeFicha,
  findFichaById,
  findUserById,
  createProject,
  detectarSimilitudes,
  createNotification,
  displayNames,
} from '../../../data/mockData'
// Estilos reutilizados de las páginas originales (lista + formulario)
import s from '../../../components/ListaBase/ListaBase.module.css'
import n from '../../../components/FormularioBase/FormularioBase.module.css'

const ITEMS_POR_PAGINA = 6

const ESTADO_VARIANT = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
}

const AREAS = [
  'Desarrollo Web',
  'Inteligencia Artificial',
  'Ciencia de Datos',
  'Ciberseguridad',
  'Otro',
]

function similitudInfo(similitudes, projectId) {
  const propias = similitudes.filter((s) => s.projectId1 === projectId || s.projectId2 === projectId)
  if (propias.length === 0) return null
  return {
    pct: Math.max(...propias.map((s) => Math.round(s.similitud * 100))),
    count: propias.length,
  }
}

export default function Propuestas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [creando, setCreando] = useState(() => searchParams.get('crear') === '1')

  /* ---------- Lista ---------- */
  const [filtro, setFiltro] = useState('todos')
  const [pagina, setPagina] = useState(1)

  const proyectos = useMemo(() => getProjectsByStudent(user.id), [user.id])
  const similitudes = useMemo(() => getSimilitudesValidas(), [])

  const filtrados = useMemo(
    () => (filtro === 'todos' ? proyectos : proyectos.filter((p) => p.estado === filtro)),
    [proyectos, filtro]
  )

  const inicio = (pagina - 1) * ITEMS_POR_PAGINA
  const visibles = filtrados.slice(inicio, inicio + ITEMS_POR_PAGINA)

  function cambiarFiltro(valor) {
    setFiltro(valor)
    setPagina(1)
  }

  /* ---------- Creación ---------- */
  const perfil = findUserById(user.id)
  const miFicha = useMemo(
    () => (perfil?.fichaId ? findFichaById(perfil.fichaId) : null),
    [perfil]
  )

  const [form, setForm] = useState({
    title: '',
    description: '',
    objetivoGeneral: '',
    objetivosEspecificos: '',
    areaAplicacion: '',
    keywords: '',
  })
  const [errors, setErrors] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [seleccionados, setSeleccionados] = useState([])

  const companeros = useMemo(
    () =>
      perfil?.fichaId
        ? getEstudiantesDeFicha(Number(perfil.fichaId)).filter((c) => c.id !== user.id)
        : [],
    [perfil, user.id]
  )

  function alternarCompanero(id) {
    setSeleccionados((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]))
  }

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
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validar()
    setErrors(errs)
    if (Object.keys(errs).length > 0 || !miFicha) return

    setGuardando(true)
    const project = createProject({
      title: form.title.trim(),
      description: form.description.trim(),
      studentId: user.id,
      studentName: user.nombre,
      instructorId: miFicha.instructorId,
      instructorName: miFicha.instructorName,
      fichaId: miFicha.id,
      keywords: form.keywords.trim(),
      objetivoGeneral: form.objetivoGeneral.trim(),
      objetivosEspecificos: objetivosValidos.join('\n'),
      areaAplicacion: form.areaAplicacion,
      integrantes: [user.nombre, ...seleccionados.map((idSel) => {
        const comp = companeros.find((c) => c.id === idSel)
        return comp ? comp.name : null
      }).filter(Boolean)],
      estado: 'pendiente',
    })

    // Detección inmediata contra el corpus aprobado del mismo programa:
    // así ResultadoAnalisis ya muestra la lista completa al subir,
    // sin esperar a la aprobación del instructor.
    detectarSimilitudes(project.id)

    // Avisar a cada compañero añadido al equipo
    seleccionados.forEach((idComp) => {
      const comp = companeros.find((c) => c.id === idComp)
      if (!comp) return
      createNotification({
        mensaje: `${user.nombre} te añadió como integrante de '${project.title}'`,
        tipo: 'mensaje',
        userId: comp.id,
        projectId: project.id,
      })
    })

    navigate('/aprendiz/analizando-proyecto', { state: { projectId: project.id }, replace: true })
  }

  if (!miFicha) {
    return (
      <DashboardLayout role="aprendiz" titulo="Mis Propuestas">
        <div className={s.page}>
          <EmptyState
            icon={<GraduationCap size={40} weight="light" />}
            title="Aún no perteneces a una ficha"
            message="Únete con el código que te dio tu instructor para poder crear propuestas."
            actionLabel="Ir a Mi Ficha"
            onAction={() => navigate('/aprendiz/ficha')}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="aprendiz" titulo={creando ? 'Nueva Propuesta' : 'Mis Propuestas'}>
      <div className={s.wrapper}>
        <PageHeader
          title={creando ? 'Nueva Propuesta' : 'Mis Propuestas'}
          subtitle={
            creando
              ? 'Registra tu idea: una solución de software para un problema concreto. No necesitas definir tecnologías ni entregables todavía.'
              : 'Administra y revisa el estado de tus propuestas académicas'
          }
          icon={creando ? <Plus /> : <FolderOpen />}
          breadcrumb={
            creando
              ? [
                  { label: 'Dashboard', to: '/aprendiz/dashboard', icon: <ChartBar size={14} /> },
                  { label: 'Mis Propuestas', icon: <FolderOpen size={14} />, onClick: () => setCreando(false) },
                  { label: 'Nueva propuesta' },
                ]
              : []
          }
          onBack={creando ? () => setCreando(false) : undefined}
          actions={
            !creando ? (
              <Button type="button" onClick={() => setCreando(true)}>
                <Plus size={14} /> Nueva propuesta
              </Button>
            ) : undefined
          }
        />

        {creando ? (
          <form className={n.form} onSubmit={handleSubmit} noValidate>
            <FormField label="Nombre de la propuesta" error={errors.title} required>
              <Input
                type="text"
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
              <Textarea
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
              <Textarea
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
              <Textarea
                rows={5}
                value={form.objetivosEspecificos}
                onChange={(e) => set('objetivosEspecificos', e.target.value)}
                placeholder={'Implementar sensores de humedad en el cultivo.\nDiseñar un panel web para visualizar los datos.\nEvaluar el ahorro de agua durante un mes.'}
              />
            </FormField>

          <FormField
            label={`Integrantes del equipo${seleccionados.length > 0 ? ` (${seleccionados.length})` : ''}`}
            help="Opcional. Compañeros de tu ficha con los que desarrollarás la propuesta."
          >
            {companeros.length === 0 ? (
              <p className={n.hint}>Aún no hay compañeros en tu ficha para invitar.</p>
            ) : (
              <div className={n.chipList}>
                {companeros.map((c) => {
                  const activo = seleccionados.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`${n.chip} ${activo ? n.chipActive : ''}`}
                      onClick={() => alternarCompanero(c.id)}
                      aria-pressed={activo}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            )}
          </FormField>

          <FormField label="Área de aplicación" error={errors.areaAplicacion} required>
            <Select
              value={form.areaAplicacion}
              onChange={(e) => set('areaAplicacion', e.target.value)}
            >
              <option value="">Selecciona un área...</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </FormField>

          <p className={n.hint}>
            Ficha de formación: {miFicha.nombre} · {miFicha.codigo} — definida al unirte con el código
          </p>

            <FormField
              label="Palabras clave"
              help="Opcional. Si aún no las tienes claras, puedes agregarlas después."
            >
              <Input
                type="text"
                value={form.keywords}
                onChange={(e) => set('keywords', e.target.value)}
                placeholder="iot, sensores, agricultura"
              />
            </FormField>

            <Actions className={n.actions}>
              <Button type="submit" disabled={guardando}>
                {guardando ? 'Enviando...' : 'Enviar propuesta y analizar'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setCreando(false)}>
                Cancelar
              </Button>
            </Actions>
          </form>
        ) : (
          <>
            <FilterBar title="Filtros">
              <label className={s.field}>
                <span className={s.label}>Estado</span>
                <Select
                  value={filtro}
                  onChange={(e) => cambiarFiltro(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
                </Select>
              </label>
            </FilterBar>

            {filtrados.length === 0 ? (
              <EmptyState
                icon={<Tray />}
                title={filtro === 'todos' && proyectos.length === 0 ? 'Aún no tienes propuestas' : 'Sin resultados'}
                message={
                  filtro === 'todos' && proyectos.length === 0
                    ? 'Registra tu primera propuesta para comenzar a analizarla en ProyecTwin.'
                    : 'No hay propuestas con el estado seleccionado. Prueba con otro filtro.'
                }
                actionLabel={
                  filtro === 'todos' && proyectos.length === 0 ? 'Crear propuesta' : undefined
                }
                actionIcon={<Plus size={14} />}
                onAction={
                  filtro === 'todos' && proyectos.length === 0 ? () => setCreando(true) : undefined
                }
              />
            ) : (
              <>
                <div className={s.cardGrid}>
                  {visibles.map((p) => {
                    const info = similitudInfo(similitudes, p.id)
                    return (
                      <Link key={p.id} to={`/aprendiz/detalle-proyecto/${p.id}`} className={s.card}>
                        <header className={s.cardHeader}>
                          <h3 className={s.cardTitle}>{p.title}</h3>
                          <Badge variant={ESTADO_VARIANT[p.estado] || 'neutral'}>
                            {displayNames.projectStatus[p.estado] || p.estado}
                          </Badge>
                        </header>
                        <p className={s.cardDesc}>{p.description}</p>
                        <footer className={s.cardFooter}>
                          <span className={s.cardMeta}><CalendarBlank size={14} /> {p.createdAt}</span>
                          {info && (
                            <Badge variant={info.pct >= 70 ? 'danger' : info.pct >= 40 ? 'warning' : 'success'}>
                              <MagnifyingGlass size={14} /> {info.pct}% · {info.count} coincidencia{info.count !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </footer>
                      </Link>
                    )
                  })}
                </div>
                <Pagination
                  totalItems={filtrados.length}
                  filteredCount={filtrados.length}
                  itemsPerPage={ITEMS_POR_PAGINA}
                  paginaActual={pagina}
                  setPaginaActual={setPagina}
                  itemName="propuestas"
                />
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
