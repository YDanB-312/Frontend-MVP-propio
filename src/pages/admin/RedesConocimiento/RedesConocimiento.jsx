import { useState, useRef, useEffect } from 'react'
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
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { ShareNetwork, Plus, Trash, PencilSimple, CheckCircle, X, Warning, CaretDown, CaretUp, ChartBar } from 'phosphor-react'
import {
  getRedes,
  getConteoFichasDeRed,
  isRedEnUso,
  createRed,
  updateRed,
  deleteRed,
} from '../../../data/mockData'
import s from '../../../components/ListaBase/ListaBase.module.css'
import nu from '../../../components/FormularioBase/FormularioBase.module.css'
import cs from './RedesConocimiento.module.css'

function ProgramasCell({ programas }) {
  const LIMITE = 3
  const [expandido, setExpandido] = useState(false)
  if (!programas?.length) return <span className={cs.muted}>—</span>
  // Si cabe dentro del límite, mostrar directo sin controles
  if (programas.length <= LIMITE) {
    return (
      <span className={cs.tags}>
        {programas.map((p) => (
          <Badge key={p} variant="info">{p}</Badge>
        ))}
      </span>
    )
  }
  const visibles = expandido ? programas : programas.slice(0, LIMITE)
  const ocultos = programas.length - LIMITE
  return (
    <div className={cs.programasCell}>
      <span className={cs.tags} title={programas.join(', ')}>
        {visibles.map((p) => (
          <Badge key={p} variant="info">{p}</Badge>
        ))}
        {!expandido && (
          <span className={cs.restBadge} aria-hidden="true">+{ocultos}</span>
        )}
      </span>
      <div className={cs.programasMeta}>
        <span className={cs.countHint}>{programas.length} programas</span>
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

function ProgramasInput({ programas, setProgramas, error }) {
  const [nuevo, setNuevo] = useState('')
  const [localErr, setLocalErr] = useState('')

  const agregar = () => {
    const val = nuevo.trim()
    if (!val) { setLocalErr('Escribe un programa.'); return }
    if (programas.some(p => p.toLowerCase() === val.toLowerCase())) {
      setLocalErr('Ese programa ya está en la lista.')
      return
    }
    setProgramas([...programas, val])
    setNuevo('')
    setLocalErr('')
  }

  const quitar = (idx) => {
    setProgramas(programas.filter((_, i) => i !== idx))
  }

  const editar = (idx, val) => {
    const next = [...programas]
    next[idx] = val
    setProgramas(next)
  }

  return (
    <div className={cs.programasWrap}>
      <div className={cs.programasList}>
        {programas.map((p, i) => (
          <div key={i} className={cs.programaRow}>
            <div className={cs.inputWrap}>
              <Input
                value={p}
                onChange={(e) => editar(i, e.target.value)}
                placeholder="Nombre del programa"
                maxLength={60}
              />
              <button
                type="button"
                className={cs.clearBtn}
                onClick={() => quitar(i)}
                aria-label={`Quitar ${p}`}
                disabled={programas.length <= 1}
                title={programas.length <= 1 ? 'Debe quedar al menos un programa' : 'Quitar programa'}
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
          maxLength={60}
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
  const [, setTick] = useState(0)
  const refrescar = () => setTick(t => t + 1)

  // Modos: lista | crear | editar
  const [modo, setModo] = useState('lista')
  const [editId, setEditId] = useState(null)

  const redes = getRedes()

  const filtradas = redes.filter(r => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return true
    return r.nombre.toLowerCase().includes(q) || r.programas.some(p => p.toLowerCase().includes(q))
  })

  // Form state
  const [formNombre, setFormNombre] = useState('')
  const [formProgramas, setFormProgramas] = useState([''])
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null) // { tipo, msg }
  const alertaTimer = useRef(null)

  // Delete confirm
  const [confirmId, setConfirmId] = useState(null)
  const redAEliminar = confirmId ? redes.find(r => r.id === confirmId) : null

  useEffect(() => () => { if (alertaTimer.current) clearTimeout(alertaTimer.current) }, [])

  const mostrarAlerta = (tipo, msg) => {
    setAlerta({ tipo, msg })
    if (alertaTimer.current) clearTimeout(alertaTimer.current)
    alertaTimer.current = setTimeout(() => setAlerta(null), 4000)
  }

  const abrirCrear = () => {
    setFormNombre('')
    setFormProgramas([''])
    setErrores({})
    setAlerta(null)
    setEditId(null)
    setModo('crear')
  }

  const abrirEditar = (red) => {
    setFormNombre(red.nombre)
    setFormProgramas(red.programas.length ? [...red.programas] : [''])
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
    const lista = formProgramas.map(p => p.trim()).filter(Boolean)
    if (lista.length === 0) err.programas = 'Debe haber al menos un programa.'
    else {
      const lower = lista.map(p => p.toLowerCase())
      if (new Set(lower).size !== lower.length) err.programas = 'Hay programas duplicados.'
    }
    return err
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) { setErrores(err); return }
    const lista = formProgramas.map(p => p.trim()).filter(Boolean)
    let res
    if (modo === 'editar') {
      res = updateRed(editId, { nombre: formNombre.trim(), programas: lista })
    } else {
      res = createRed({ nombre: formNombre.trim(), programas: lista })
    }
    if (!res.ok) {
      // mapear error a campo si es posible
      const msg = res.error || 'Error al guardar.'
      if (msg.toLowerCase().includes('programa')) setErrores({ programas: msg })
      else if (msg.toLowerCase().includes('nombre')) setErrores({ nombre: msg })
      else setAlerta({ tipo: 'error', msg })
      return
    }
    setModo('lista')
    setEditId(null)
    setErrores({})
    refrescar()
    mostrarAlerta('success', modo === 'editar' ? 'Red actualizada correctamente.' : 'Red creada correctamente.')
  }

  const confirmarEliminar = () => {
    if (!confirmId) return
    const res = deleteRed(confirmId)
    setConfirmId(null)
    if (!res.ok) {
      mostrarAlerta('error', res.error)
      return
    }
    refrescar()
    mostrarAlerta('success', 'Red eliminada correctamente.')
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

        {enEdicion ? (
          <DataPanel title={modo === 'editar' ? 'Editar red' : 'Nueva red'} icon={<ShareNetwork />}>
            <form className={`${nu.form} ${cs.formFull}`} onSubmit={onSubmit} noValidate>
              <FormField label="Nombre de la red" required error={errores.nombre}>
                <Input
                  value={formNombre}
                  onChange={(e) => { setFormNombre(e.target.value); setErrores(e2 => ({ ...e2, nombre: undefined })) }}
                  placeholder="Ej. Informática, Diseño y Desarrollo de Software"
                  maxLength={80}
                />
              </FormField>

              <FormField label="Programas" required error={errores.programas}>
                <ProgramasInput programas={formProgramas} setProgramas={(v) => { setFormProgramas(v); setErrores(e2 => ({ ...e2, programas: undefined })) }} error={errores.programas} />
              </FormField>

              <Actions form>
                <Button type="submit">
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
                  onChange={(e) => setBusqueda(e.target.value)}
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
                  redes.length === 0
                    ? 'No hay redes registradas. Crea la primera para comenzar.'
                    : 'Ninguna red coincide con la búsqueda.'
                }
                actionLabel={redes.length === 0 ? 'Crear primera red' : undefined}
                onAction={redes.length === 0 ? abrirCrear : undefined}
              />
            ) : (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Red</th>
                      <th>Programas</th>
                      <th>Fichas</th>
                      <th className={s.colActions}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((r) => {
                      const conteo = getConteoFichasDeRed(r.id)
                      const enUso = isRedEnUso(r.id)
                      return (
                        <tr key={r.id}>
                          <td data-label="Red">
                            <span className={s.title}>{r.nombre}</span>
                            {enUso && <span className={s.subText}>En uso</span>}
                          </td>
                          <td data-label="Programas">
                            <ProgramasCell programas={r.programas} />
                          </td>
                          <td data-label="Fichas">
                            <span className={s.count}>{conteo}</span>
                          </td>
                          <td data-label="Acciones" className={s.colActions}>
                            <span className={s.actions}>
                              <Button size="sm" variant="secondary" onClick={() => abrirEditar(r)}>
                                <PencilSimple size={14} /> Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setConfirmId(r.id)}
                                title={enUso ? 'No se puede eliminar: está en uso' : 'Eliminar red'}
                              >
                                <Trash size={14} /> Eliminar
                              </Button>
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <ConfirmModal
          open={!!confirmId}
          titulo="Eliminar red"
          mensaje={
            redAEliminar
              ? isRedEnUso(redAEliminar.id)
                ? `No se puede eliminar "${redAEliminar.nombre}" porque tiene programas con fichas o proyectos asociados. Reasigna o elimina esas fichas primero.`
                : `¿Eliminar la red "${redAEliminar.nombre}"? Esta acción no se puede deshacer.`
              : ''
          }
          textoConfirmar={redAEliminar && isRedEnUso(redAEliminar.id) ? 'Entendido' : 'Eliminar'}
          onConfirmar={() => {
            if (redAEliminar && isRedEnUso(redAEliminar.id)) setConfirmId(null)
            else confirmarEliminar()
          }}
          onCancelar={() => setConfirmId(null)}
        />
      </div>
    </DashboardLayout>
  )
}
