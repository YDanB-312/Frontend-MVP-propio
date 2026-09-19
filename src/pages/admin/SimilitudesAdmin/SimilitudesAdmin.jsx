import { useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import DataTable from '../../../components/DataTable/DataTable'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import StatChip from '../../../components/StatChip/StatChip'
import ApiState from '../../../components/ApiState/ApiState'
import { useApi } from '../../../lib/useApi'
import { similitudes, proyectos, centros, programas, fichas, motor } from '../../../lib/recursos'
import { norm, fechaDesdeApi } from '../../../utils/helpers'
import s from '../../../components/ListaBase/ListaBase.module.css'
import local from './SimilitudesAdmin.module.css'
import { Eye, MagnifyingGlass } from 'phosphor-react'
import { PAGINA_TABLA } from '../../../constants/pagination'

const ITEMS_POR_PAGINA = PAGINA_TABLA

const ESTADO_LABEL = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }
const PROY_VARIANT = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
}

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

export default function SimilitudesAdmin() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCentro, setFiltroCentro] = useState('todos')
  const [filtroFicha, setFiltroFicha] = useState('todos')
  const [filtroPrograma, setFiltroPrograma] = useState('todos')
  const [pagina, setPagina] = useState(1)

  // Fuente única: la API. Similitudes + propuestas (autores/estado) + catálogos.
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [listaSimilitudes, listaProyectos, listaCentros, listaProgramas, listaFichas, configMotor] = await Promise.all([
        similitudes.listar(),
        proyectos.listar(),
        centros.listar(),
        programas.listar(),
        fichas.listar('program,trainingCenter'),
        motor.obtener(),
      ])
      return { listaSimilitudes, listaProyectos, listaCentros, listaProgramas, listaFichas, configMotor }
    },
    [],
    { inicial: null }
  )

  const listaSimilitudes = data?.listaSimilitudes || []
  const listaProyectos = data?.listaProyectos || []
  const listaCentros = data?.listaCentros || []
  const listaProgramas = data?.listaProgramas || []
  const listaFichas = data?.listaFichas || []
  const motorConfig = data?.configMotor || { umbral: 0.2, meses: 12 }
  const umbralPct = Math.round(motorConfig.umbral * 100)

  const proyectosPorId = new Map(listaProyectos.map((p) => [Number(p.id), p]))

  const fichasFiltro = filtroCentro === 'todos'
    ? listaFichas
    : listaFichas.filter((f) => String(f.training_center_id) === String(filtroCentro))
  const programasFiltro = [...new Set(listaProgramas.map((p) => p.nombre))].sort()

  // Proyecto (con autor incluido) de cada lado del par.
  const proyectoDe = (sim, lado) => proyectosPorId.get(Number(lado === 1 ? sim.id_proyecto_1 : sim.id_proyecto_2)) || null
  const programaDeProyecto = (p) => p?.classGroup?.program?.nombre || ''

  const filtradas = listaSimilitudes.filter((sim) => {
    const p1 = proyectoDe(sim, 1)
    const p2 = proyectoDe(sim, 2)
    const q = norm(busqueda.trim())
    const coincideQ =
      !q ||
      norm(p1?.titulo || sim.project1?.titulo).includes(q) ||
      norm(p2?.titulo || sim.project2?.titulo).includes(q) ||
      norm(nombreCompleto(p1?.creator)).includes(q) ||
      norm(nombreCompleto(p2?.creator)).includes(q)
    const coincideEstado = filtroEstado === 'todos' || p1?.estado === filtroEstado || p2?.estado === filtroEstado
    const coincidePrograma =
      filtroPrograma === 'todos' ||
      programaDeProyecto(p1) === filtroPrograma ||
      programaDeProyecto(p2) === filtroPrograma
    const coincideCentro =
      filtroCentro === 'todos' ||
      String(p1?.classGroup?.training_center_id || '') === String(filtroCentro) ||
      String(p2?.classGroup?.training_center_id || '') === String(filtroCentro)
    const coincideFicha =
      filtroFicha === 'todos' ||
      String(p1?.id_class_group || '') === String(filtroFicha) ||
      String(p2?.id_class_group || '') === String(filtroFicha)
    return coincideQ && coincideEstado && coincidePrograma && coincideCentro && coincideFicha
  })

  const paginadas = filtradas.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroEstado('todos')
    setFiltroCentro('todos')
    setFiltroFicha('todos')
    setFiltroPrograma('todos')
    setPagina(1)
  }

  const altas = listaSimilitudes.filter((sim) => Math.round(Number(sim.porcentaje) || 0) >= 70).length
  const programasAfectados = new Set(
    listaSimilitudes.flatMap((sim) => [
      programaDeProyecto(proyectoDe(sim, 1)),
      programaDeProyecto(proyectoDe(sim, 2)),
    ]).filter(Boolean)
  ).size

  return (
    <DashboardLayout role="admin" titulo="Similitudes">
      <div className={s.page}>
        <PageHeader
          title="Similitudes Detectadas"
          subtitle={`Umbral ${umbralPct}% · corpus de ${motorConfig.meses} meses. Analiza los pares y dales seguimiento.`}
          icon={<MagnifyingGlass />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard' },
            { label: 'Similitudes' },
          ]}
          actions={
            <Button as="link" to="/admin/config-similitud" size="sm" variant="secondary">
              Ajustar motor
            </Button>
          }
        />

        <ApiState cargando={cargando} error={error} onReintentar={recargar}>
          <div className={local.tira} role="status" aria-label="Resumen de coincidencias">
            <StatChip label="Pares" value={listaSimilitudes.length} />
            <StatChip label="Sobre 70%" value={altas} />
            <StatChip label="Programas" value={programasAfectados} />
            <StatChip label="Umbral" value={`${umbralPct}%`} />
          </div>

          <FilterBar title="Buscar y filtrar">
            <label className={s.field}>
              <span className={s.label}>Buscar</span>
              <Input
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPagina(1)
                }}
                placeholder="Título o aprendiz…"
              />
            </label>
            <label className={s.field}>
              <span className={s.label}>Estado de la propuesta</span>
              <Select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value)
                  setPagina(1)
                }}
              >
                <option value="todos">Todos</option>
                <option value="pendiente">{ESTADO_LABEL.pendiente}</option>
                <option value="aprobado">{ESTADO_LABEL.aprobado}</option>
                <option value="rechazado">{ESTADO_LABEL.rechazado}</option>
              </Select>
            </label>
            <label className={s.field}>
              <span className={s.label}>Centro</span>
              <Select
                value={filtroCentro}
                onChange={(e) => {
                  setFiltroCentro(e.target.value)
                  setFiltroFicha('todos')
                  setPagina(1)
                }}
              >
                <option value="todos">Todos</option>
                {listaCentros.map((ct) => (
                  <option key={ct.id} value={String(ct.id)}>
                    {ct.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className={s.field}>
              <span className={s.label}>Ficha</span>
              <Select
                value={filtroFicha}
                onChange={(e) => {
                  setFiltroFicha(e.target.value)
                  setPagina(1)
                }}
              >
                <option value="todos">Todas</option>
                {fichasFiltro.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.codigo} · {f.nombre}
                  </option>
                ))}
              </Select>
            </label>
            <label className={s.field}>
              <span className={s.label}>Programa</span>
              <Select
                value={filtroPrograma}
                onChange={(e) => {
                  setFiltroPrograma(e.target.value)
                  setPagina(1)
                }}
              >
                <option value="todos">Todos</option>
                {programasFiltro.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </Select>
            </label>
            <p className={s.info}>
              {filtradas.length} similitud{filtradas.length !== 1 ? 'es' : ''}
            </p>
          </FilterBar>

          {paginadas.length === 0 ? (
            listaSimilitudes.length === 0 ? (
              <EmptyState
                icon={<MagnifyingGlass />}
                title="Sin coincidencias con el umbral vigente"
                message={`Ninguna propuesta del sistema alcanza el umbral de ${umbralPct}% en la ventana de ${motorConfig.meses} meses. Baja el umbral o amplía la ventana y recalibra.`}
              />
            ) : (
              <EmptyState
                icon={<MagnifyingGlass />}
                title="Sin similitudes"
                message="Ninguna similitud coincide con los filtros aplicados."
                actionLabel="Limpiar filtros"
                onAction={limpiarFiltros}
              />
            )
          ) : (
            <>
              <DataTable
                ariaLabel="Similitudes detectadas"
                columns={[
                  {
                    key: 'a',
                    header: 'Propuesta A',
                    render: (sim) => {
                      const p = proyectoDe(sim, 1)
                      return (
                        <>
                          <span className={s.title}>{p?.titulo || sim.project1?.titulo}</span>
                          <br />
                          <span className={s.subText}>{nombreCompleto(p?.creator) || '—'}</span>
                        </>
                      )
                    },
                  },
                  {
                    key: 'b',
                    header: 'Propuesta B',
                    render: (sim) => {
                      const p = proyectoDe(sim, 2)
                      return (
                        <>
                          <span className={s.title}>{p?.titulo || sim.project2?.titulo}</span>
                          <br />
                          <span className={s.subText}>{nombreCompleto(p?.creator) || '—'}</span>
                        </>
                      )
                    },
                  },
                  {
                    key: 'similitud',
                    header: 'Similitud',
                    render: (sim) => <GradeBadge score={Math.round(Number(sim.porcentaje) || 0)} size="sm" />,
                  },
                  {
                    key: 'estados',
                    header: 'Estado',
                    render: (sim) => {
                      const estadoA = proyectoDe(sim, 1)?.estado || '—'
                      const estadoB = proyectoDe(sim, 2)?.estado || '—'
                      return (
                        <span className={local.estadoPair}>
                          <Badge variant={PROY_VARIANT[estadoA] || 'neutral'}>
                            A: {ESTADO_LABEL[estadoA] || estadoA}
                          </Badge>
                          <Badge variant={PROY_VARIANT[estadoB] || 'neutral'}>
                            B: {ESTADO_LABEL[estadoB] || estadoB}
                          </Badge>
                        </span>
                      )
                    },
                  },
                    { key: 'fecha', header: 'Fecha', render: (sim) => fechaDesdeApi(sim.fecha) || '—' },
                  {
                    key: 'acciones',
                    header: 'Acciones',
                    align: 'end',
                    render: (sim) => (
                      <Button
                        as="link"
                        to={`/admin/detalle-similitud/${sim.id}`}
                        viewTransition
                        size="sm"
                        variant="secondary"
                      >
                        <Eye size={14} /> Ver
                      </Button>
                    ),
                  },
                ]}
                rows={paginadas}
                keyOf={(sim) => sim.id}
              />

              <Pagination
                totalItems={filtradas.length}
                itemsPerPage={ITEMS_POR_PAGINA}
                paginaActual={pagina}
                setPaginaActual={setPagina}
                itemName="similitudes"
                filteredCount={filtradas.length}
              />
            </>
          )}
        </ApiState>
      </div>
    </DashboardLayout>
  )
}
