import { useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import DataPanel from '../../../components/DataPanel/DataPanel'
import FormField from '../../../components/FormField/FormField'
import Badge from '../../../components/Badge/Badge'
import Alert from '../../../components/Alert/Alert'
import Button from '../../../components/Button/Button'
import Actions from '../../../components/Actions/Actions'
import { Input } from '../../../components/Input/Input'
import EmptyState from '../../../components/EmptyState/EmptyState'
import DataTable from '../../../components/DataTable/DataTable'
import Pagination from '../../../components/Pagination/Pagination'
import ApiState from '../../../components/ApiState/ApiState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { norm } from '../../../utils/helpers'
import { PAGINA_TABLA } from '../../../constants/pagination'
import { MAX_NOMBRE, MAX_PROGRAMA } from '../../../utils/validation'
import { ShareNetwork, Plus, Trash, PencilSimple, CheckCircle, X, Warning, CaretDown, CaretUp, ChartBar } from 'phosphor-react'
import { useApi } from '../../../lib/useApi'
import { redes, programas, fichas } from '../../../lib/recursos'
import { toFieldErrors } from '../../../lib/api'
import s from '../../../components/ListaBase/ListaBase.module.css'
import nu from '../../../components/FormularioBase/FormularioBase.module.css'
import cs from './RedesConocimiento.module.css'

const ITEMS_POR_PAGINA = PAGINA_TABLA

// Datos por defecto de un programa nuevo (la API exige nivel y trimestres).
const PROGRAMA_DEFECTO = { nivel: 'Tecnologo', num_trimestres: 6 }

function ProgramasCell({ programas: lista }) {
  const LIMITE = 3
  const [expandido, setExpandido] = useState(false)
  if (!lista?.length) return <span className={cs.muted}>—</span>
  const nombres = lista.map((p) => p.nombre)
  // Si cabe dentro del límite, mostrar directo sin controles
  if (lista.length <= LIMITE) {
    return (
      <span className={cs.tags}>
        {nombres.map((p) => (
          <Badge key={p} variant="info">{p}</Badge>
        ))}
      </span>
    )
  }
  const visibles = expandido ? nombres : nombres.slice(0, LIMITE)
  const ocultos = lista.length - LIMITE
  return (
    <div className={cs.programasCell}>
      <span className={cs.tags} title={nombres.join(', ')}>
        {visibles.map((p) => (
          <Badge key={p} variant="info">{p}</Badge>
        ))}
        {!expandido && (
          <span className={cs.restBadge} aria-hidden="true">+{ocultos}</span>
        )}
      </span>
      <div className={cs.programasMeta}>
        <span className={cs.countHint}>{lista.length} programas</span>
        <button
          type="button"
          className={cs.moreBtn}
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
          aria-label={expandido ? 'Mostrar menos programas' : `Mostrar ${ocultos} programas más`}
        >
          {expandido ? (
            <><CaretUp size={12} weight="bold" /> Mostrar menos</>
          ) : (
            <><CaretDown size={12} weight="bold" /> Ver {ocultos} más</>
          )}
        </button>
      </div>
    </div>
  )
}

// Editor de programas como objetos { id, nombre }: id null = aún no creado.
function ProgramasInput({ programas: lista, setProgramas, error }) {
  const [nuevo, setNuevo] = useState('')
  const [localErr, setLocalErr] = useState('')

  const agregar = () => {
    const val = nuevo.trim()
    if (!val) { setLocalErr('Escribe un programa.'); return }
    if (lista.some((p) => p.nombre.toLowerCase() === val.toLowerCase())) {
      setLocalErr('Ese programa ya está en la lista.')
      return
    }
    setProgramas([...lista, { id: null, nombre: val }])
    setNuevo('')
    setLocalErr('')
  }

  const quitar = (idx) => {
    setProgramas(lista.filter((_, i) => i !== idx))
  }

  const editar = (idx, val) => {
    const next = [...lista]
    next[idx] = { ...next[idx], nombre: val }
    setProgramas(next)
  }

  return (
    <div className={cs.programasWrap}>
      <div className={cs.programasList}>
        {lista.map((p, i) => (
          <div key={p.id ?? `nuevo-${i}`} className={cs.programaRow}>
            <div className={cs.inputWrap}>
              <Input
                value={p.nombre}
                onChange={(e) => editar(i, e.target.value)}
                placeholder="Nombre del programa"
                aria-label={`Nombre del programa ${i + 1}`}
                maxLength={MAX_PROGRAMA}
              />
              <button
                type="button"
                className={cs.clearBtn}
                onClick={() => quitar(i)}
                aria-label={`Quitar ${p.nombre}`}
                title="Quitar programa"
              >
                <X size={12} weight="bold" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={cs.addRow}>
        <Input
          value={nuevo}
          onChange={(e) => { setNuevo(e.target.value); setLocalErr('') }}
          placeholder="Nuevo programa… ej. ADSO"
          aria-label="Nuevo programa"
          maxLength={MAX_PROGRAMA}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregar() } }}
        />
        <Button type="button" variant="secondary" onClick={agregar}>
          <Plus size={14} /> Agregar
        </Button>
      </div>
      {(error || localErr) && <p className={cs.error}>{error || localErr}</p>}
      <p className={nu.hint}>Mínimo 1 programa. Los nombres no pueden repetirse dentro de la red ni en otra red.</p>
    </div>
  )
}

export default function RedesConocimiento() {
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  // Fuente única: la API. Redes + programas + fichas (para el conteo).
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [listaRedes, listaProgramas, listaFichas] = await Promise.all([
        redes.listar(),
        programas.listar('knowledgeNetwork'),
        fichas.listar(),
      ])
      return { listaRedes, listaProgramas, listaFichas }
    },
    [],
    { inicial: null }
  )

  const listaRedes = data?.listaRedes || []
  const listaProgramas = data?.listaProgramas || []
  const listaFichas = data?.listaFichas || []

  // Red aplanada con sus programas anidados.
  const redesConProgramas = listaRedes.map((r) => ({
    ...r,
    programas: listaProgramas.filter((p) => Number(p.knowledge_network_id) === Number(r.id)),
  }))

  // Conteo de fichas por red (a través de sus programas).
  const programasIdsPorRed = new Map(
    redesConProgramas.map((r) => [Number(r.id), new Set(r.programas.map((p) => Number(p.id)))])
  )
  const fichasDeRed = (redId) => {
    const ids = programasIdsPorRed.get(Number(redId)) || new Set()
    return listaFichas.filter((f) => ids.has(Number(f.id_programa))).length
  }
  const redEnUso = (redId) => fichasDeRed(redId) > 0

  // Modos: lista | crear | editar
  const [modo, setModo] = useState('lista')
  const [editId, setEditId] = useState(null)

  const filtradas = redesConProgramas.filter((r) => {
    const q = norm(busqueda.trim())
    if (!q) return true
    return norm(r.nombre).includes(q) || r.programas.some((p) => norm(p.nombre).includes(q))
  })

  // Paginación (mismo patrón que las demás tablas admin).
  const paginadas = filtradas.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  // Form state
  const [formNombre, setFormNombre] = useState('')
  const [formProgramas, setFormProgramas] = useState([])
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null) // { tipo, msg }
  const [guardando, setGuardando] = useState(false)

  // Delete confirm
  const [confirmId, setConfirmId] = useState(null)
  const redAEliminar = confirmId ? redesConProgramas.find((r) => Number(r.id) === Number(confirmId)) : null

  const mostrarAlerta = (tipo, msg) => setAlerta({ tipo, msg })

  const abrirCrear = () => {
    setFormNombre('')
    setFormProgramas([])
    setErrores({})
    setAlerta(null)
    setEditId(null)
    setModo('crear')
  }

  const abrirEditar = (red) => {
    setFormNombre(red.nombre)
    setFormProgramas(red.programas.map((p) => ({ id: p.id, nombre: p.nombre })))
    setErrores({})
    setAlerta(null)
    setEditId(red.id)
    setModo('editar')
  }

  const cancelarForm = () => {
    setModo('lista')
    setEditId(null)
    setErrores({})
    setAlerta(null)
  }

  const validar = () => {
    const err = {}
    if (!formNombre.trim()) err.nombre = 'El nombre es obligatorio.'
    else if (formNombre.trim().length < 3) err.nombre = 'Debe tener al menos 3 caracteres.'
    else if (redesConProgramas.some((r) => (modo !== 'editar' || Number(r.id) !== Number(editId)) && String(r.nombre || '').trim().toLowerCase() === formNombre.trim().toLowerCase())) {
      err.nombre = 'Ya existe una red con ese nombre.'
    }
    const lista = formProgramas.map((p) => p.nombre.trim()).filter(Boolean)
    if (lista.length === 0) err.programas = 'Debe haber al menos un programa.'
    else {
      const lower = lista.map((p) => p.toLowerCase())
      if (new Set(lower).size !== lower.length) err.programas = 'Hay programas duplicados.'
      else {
        // Duplicado contra otras redes
        const otrosProgramas = redesConProgramas
          .filter((r) => !(modo === 'editar' && Number(r.id) === Number(editId)))
          .flatMap((r) => r.programas)
          .map((p) => String(p.nombre).toLowerCase())
        const dup = lower.find((p) => otrosProgramas.includes(p))
        if (dup) err.programas = `El programa "${lista[lower.indexOf(dup)]}" ya existe en otra red.`
      }
    }
    return err
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) { setErrores(err); return }
    const lista = formProgramas
      .map((p) => ({ id: p.id, nombre: p.nombre.trim() }))
      .filter((p) => p.nombre)

    setGuardando(true)
    try {
      if (modo === 'editar') {
        await redes.actualizar(editId, { nombre: formNombre.trim() })
        const existentes = listaProgramas.filter((p) => Number(p.knowledge_network_id) === Number(editId))
        const idsEnForm = new Set(lista.filter((p) => p.id).map((p) => Number(p.id)))
        // 1) Renombrar / crear
        for (const item of lista) {
          if (item.id) {
            const previo = existentes.find((p) => Number(p.id) === Number(item.id))
            if (previo && previo.nombre !== item.nombre) {
              await programas.actualizar(item.id, {
                nombre: item.nombre,
                nivel: previo.nivel,
                num_trimestres: previo.num_trimestres,
                knowledge_network_id: Number(editId),
              })
            }
          } else {
            await programas.crear({
              nombre: item.nombre,
              ...PROGRAMA_DEFECTO,
              knowledge_network_id: Number(editId),
            })
          }
        }
        // 2) Eliminar los que ya no están en el formulario
        for (const previo of existentes) {
          if (!idsEnForm.has(Number(previo.id))) await programas.eliminar(previo.id)
        }
      } else {
        const red = await redes.crear({ nombre: formNombre.trim() })
        for (const item of lista) {
          await programas.crear({
            nombre: item.nombre,
            ...PROGRAMA_DEFECTO,
            knowledge_network_id: red.id,
          })
        }
      }
      await recargar()
      setModo('lista')
      setEditId(null)
      setErrores({})
      mostrarAlerta('success', modo === 'editar' ? 'Red actualizada correctamente.' : 'Red creada correctamente.')
    } catch (error) {
      const campos = toFieldErrors(error?.data)
      if (campos.nombre) {
        setErrores({ nombre: 'Ya existe una red con ese nombre.' })
        return
      }
      mostrarAlerta('error', error?.data?.message || 'No se pudo guardar la red. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminar = async () => {
    if (!confirmId) return
    try {
      // El backend bloquea (409) si la red tiene programas: se eliminan primero.
      const asociados = listaProgramas.filter((p) => Number(p.knowledge_network_id) === Number(confirmId))
      for (const p of asociados) await programas.eliminar(p.id)
      await redes.eliminar(confirmId)
      setConfirmId(null)
      await recargar()
      mostrarAlerta('success', 'Red eliminada correctamente.')
    } catch (error) {
      setConfirmId(null)
      mostrarAlerta('error', error?.data?.message || 'No se pudo eliminar la red. Intenta de nuevo.')
    }
  }

  const enEdicion = modo === 'crear' || modo === 'editar'

  return (
    <DashboardLayout role="admin" titulo={enEdicion ? (modo === 'editar' ? 'Editar Red' : 'Nueva Red') : 'Redes de Conocimiento'}>
      <div className={s.page}>
        <PageHeader
          title={enEdicion ? (modo === 'editar' ? 'Editar Red de Conocimiento' : 'Nueva Red de Conocimiento') : 'Redes de Conocimiento'}
          subtitle={
            enEdicion
              ? 'Define el nombre de la red y sus programas asociados. Los programas deben ser únicos en todo el sistema.'
              : 'Gestiona las redes y sus programas. Cada ficha pertenece a un programa de una red.'
          }
          icon={<ShareNetwork />}
          breadcrumb={
            enEdicion
              ? [
                  { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
                  { label: 'Redes de Conocimiento', icon: <ShareNetwork size={14} />, onClick: cancelarForm },
                  { label: modo === 'editar' ? 'Editar red' : 'Nueva red' },
                ]
              : []
          }
          onBack={enEdicion ? cancelarForm : undefined}
          actions={
            !enEdicion ? (
              <Button type="button" onClick={abrirCrear}>
                <Plus size={14} /> Nueva Red
              </Button>
            ) : undefined
          }
        />

        {alerta && (
          <Alert variant={alerta.tipo === 'error' ? 'danger' : 'success'}>
            {alerta.tipo === 'error' ? <Warning size={14} /> : <CheckCircle size={14} />} {alerta.msg}
          </Alert>
        )}

        <ApiState cargando={cargando} error={error} onReintentar={recargar}>
          {enEdicion ? (
            <DataPanel title={modo === 'editar' ? 'Editar red' : 'Nueva red'} icon={<ShareNetwork />}>
              <form className={`${nu.form} ${cs.formFull}`} onSubmit={onSubmit} noValidate>
                <FormField label="Nombre de la red" required error={errores.nombre}>
                  <Input
                    value={formNombre}
                    onChange={(e) => { setFormNombre(e.target.value); setErrores((e2) => ({ ...e2, nombre: undefined })) }}
                    placeholder="Ej. Informática, Diseño y Desarrollo de Software"
                    maxLength={MAX_NOMBRE}
                  />
                </FormField>

                <FormField label="Programas" required error={errores.programas}>
                  <ProgramasInput
                    programas={formProgramas}
                    setProgramas={(v) => { setFormProgramas(v); setErrores((e2) => ({ ...e2, programas: undefined })) }}
                    error={errores.programas}
                  />
                </FormField>

                <Actions form>
                  <Button type="submit" disabled={guardando}>
                    <CheckCircle size={14} /> {modo === 'editar' ? 'Guardar cambios' : 'Crear red'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={cancelarForm}>
                    Cancelar
                  </Button>
                </Actions>
              </form>
            </DataPanel>
          ) : (
            <>
              <FilterBar title="Buscar">
                <label className={s.field}>
                  <span className={s.label}>Buscar</span>
                  <Input
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
                    placeholder="Nombre de red o programa…"
                  />
                </label>
                <p className={s.info}>{filtradas.length} red{filtradas.length !== 1 ? 'es' : ''}</p>
              </FilterBar>

              {filtradas.length === 0 ? (
                <EmptyState
                  icon={<ShareNetwork />}
                  title="Sin redes"
                  message={
                    redesConProgramas.length === 0
                      ? 'No hay redes registradas. Crea la primera para comenzar.'
                      : 'Ninguna red coincide con la búsqueda.'
                  }
                  actionLabel={redesConProgramas.length === 0 ? 'Crear primera red' : 'Limpiar filtros'}
                  onAction={redesConProgramas.length === 0 ? abrirCrear : () => { setBusqueda('') }}
                />
              ) : (
                <>
                <DataTable
                  ariaLabel="Redes de conocimiento"
                  columns={[
                    {
                      key: 'red',
                      header: 'Red',
                      render: (r) => {
                        const enUso = redEnUso(r.id)
                        return (
                          <>
                            <span className={s.title}>{r.nombre}</span>
                            {enUso && (
                              <>
                                <br />
                                <span className={s.subText}>En uso</span>
                              </>
                            )}
                          </>
                        )
                      },
                    },
                    {
                      key: 'programas',
                      header: 'Programas',
                      render: (r) => <ProgramasCell programas={r.programas} />,
                    },
                    {
                      key: 'fichas',
                      header: 'Fichas',
                      render: (r) => <span className={s.count}>{fichasDeRed(r.id)}</span>,
                    },
                    {
                      key: 'acciones',
                      header: 'Acciones',
                      align: 'end',
                      render: (r) => {
                        const enUso = redEnUso(r.id)
                        return (
                          <span className={s.actions}>
                            <Button size="sm" variant="secondary" onClick={() => abrirEditar(r)}>
                              <PencilSimple size={14} /> Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={enUso}
                              onClick={() => setConfirmId(r.id)}
                              title={enUso ? 'No se puede eliminar: la red está en uso por fichas' : 'Eliminar red'}
                            >
                              <Trash size={14} /> Eliminar
                            </Button>
                          </span>
                        )
                      },
                    },
                  ]}
                    rows={paginadas}
                    keyOf={(r) => r.id}
                  />
                  <Pagination
                    totalItems={filtradas.length}
                    itemsPerPage={ITEMS_POR_PAGINA}
                    paginaActual={pagina}
                    setPaginaActual={setPagina}
                    itemName="redes"
                    filteredCount={filtradas.length}
                  />
                </>
              )}
            </>
          )}
        </ApiState>

        <ConfirmModal
          open={!!confirmId}
          titulo="Eliminar red"
          mensaje={
            redAEliminar
              ? `¿Eliminar la red "${redAEliminar.nombre}"? Si tiene programas asociados, primero debes quitarlos. Esta acción no se puede deshacer.`
              : ''
          }
          textoConfirmar="Sí, eliminar"
          textoCancelar="Cancelar"
          onConfirmar={confirmarEliminar}
          onCancelar={() => setConfirmId(null)}
        />
      </div>
    </DashboardLayout>
  )
}
