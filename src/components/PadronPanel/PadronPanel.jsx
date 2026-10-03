import { useState } from 'react'
import DataPanel from '../DataPanel/DataPanel'
import FormField from '../FormField/FormField'
import Button from '../Button/Button'
import Alert from '../Alert/Alert'
import ApiState from '../ApiState/ApiState'
import { Input, Select } from '../Input/Input'
import { useApi } from '../../lib/useApi'
import { padron, programas, fichas } from '../../lib/recursos'
import { ShieldCheck, Copy, ArrowsClockwise, Trash, X } from 'phosphor-react'
import s from './PadronPanel.module.css'

const TIPOS = ['CC', 'TI', 'CE', 'PA']
const ROLES = [
  { valor: 'aprendiz', texto: 'Aprendiz' },
  { valor: 'instructor', texto: 'Instructor' },
  { valor: 'admin', texto: 'Administrador' },
]

// Panel mínimo del padrón (dentro de Usuarios): el admin carga identidades y
// entrega/regenera los códigos de las cuentas pendientes de activación.
export default function PadronPanel({ onClose, onChanged }) {
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [identidades, codigos, listaProgramas, listaFichas] = await Promise.all([
        padron.listar(),
        padron.codigos(),
        programas.listar('knowledgeNetwork'),
        fichas.listar('program', {}),
      ])
      return { identidades, codigos, listaProgramas, listaFichas }
    },
    [],
    { inicial: null },
  )

  const [form, setForm] = useState({
    tipo_documento: 'CC', numero_documento: '', nombre: '', apellido: '',
    correo: '', rol: 'aprendiz', id_class_group: '',
  })
  const [msg, setMsg] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function invitar(e) {
    e.preventDefault()
    setMsg(null)
    setGuardando(true)
    try {
      const ficha = (data?.listaFichas || []).find((f) => String(f.id) === String(form.id_class_group))
      await padron.crear({
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento.trim(),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim().toLowerCase(),
        rol: form.rol,
        id_programa: ficha?.id_programa || null,
        id_class_group: ficha?.id || null,
      })
      setForm({ tipo_documento: 'CC', numero_documento: '', nombre: '', apellido: '', correo: '', rol: 'aprendiz', id_class_group: '' })
      setMsg({ tipo: 'success', texto: 'Identidad agregada. La persona ya puede registrarse con su documento y correo.' })
      await recargar()
      onChanged?.()
    } catch (err) {
      setMsg({ tipo: 'danger', texto: err?.data?.message || 'No se pudo agregar la identidad.' })
    } finally {
      setGuardando(false)
    }
  }

  async function regenerar(idUsuario) {
    setMsg(null)
    try {
      const res = await padron.regenerarCodigo(idUsuario)
      setMsg({ tipo: 'info', texto: `Código para ${res.correo}: ${res.codigo} · vence ${new Date(res.expira_en).toLocaleString()}` })
      await recargar()
    } catch (err) {
      setMsg({ tipo: 'danger', texto: err?.data?.message || 'No se pudo regenerar el código.' })
    }
  }

  async function quitar(id) {
    setMsg(null)
    try {
      await padron.eliminar(id)
      await recargar()
      onChanged?.()
    } catch (err) {
      setMsg({ tipo: 'danger', texto: err?.data?.message || 'No se pudo retirar del padrón.' })
    }
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto)
      setMsg({ tipo: 'success', texto: 'Código copiado.' })
    } catch {
      /* el admin puede copiarlo a mano */
    }
  }

  const q = busqueda.trim().toLowerCase()
  const identidades = (data?.identidades || []).filter((i) => {
    if (!q) return true
    return `${i.nombre} ${i.apellido} ${i.correo} ${i.numero_documento}`.toLowerCase().includes(q)
  })
  const codigos = data?.codigos || []
  const listaFichas = data?.listaFichas || []

  return (
    <DataPanel
      title="Padrón institucional"
      icon={<ShieldCheck />}
      actions={
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <X size={14} /> Cerrar
        </Button>
      }
    >
      <ApiState cargando={cargando} error={error} onReintentar={recargar} vacio={false}>
        {msg && <Alert variant={msg.tipo}>{msg.texto}</Alert>}

        <form className={s.form} onSubmit={invitar} noValidate>
          <div className={s.grid}>
            <FormField label="Tipo" required>
              <Select value={form.tipo_documento} onChange={(e) => set('tipo_documento', e.target.value)}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </FormField>
            <FormField label="Documento" required>
              <Input
                value={form.numero_documento}
                onChange={(e) => set('numero_documento', e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="1012345678"
                inputMode="numeric"
              />
            </FormField>
            <FormField label="Nombres" required>
              <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Camila" />
            </FormField>
            <FormField label="Apellidos" required>
              <Input value={form.apellido} onChange={(e) => set('apellido', e.target.value)} placeholder="Rojas" />
            </FormField>
            <FormField label="Correo institucional" required>
              <Input
                type="email"
                value={form.correo}
                onChange={(e) => set('correo', e.target.value)}
                placeholder="nombre.apellido@soy.sena.edu.co"
              />
            </FormField>
            <FormField label="Rol" required>
              <Select value={form.rol} onChange={(e) => set('rol', e.target.value)}>
                {ROLES.map((r) => <option key={r.valor} value={r.valor}>{r.texto}</option>)}
              </Select>
            </FormField>
            <FormField label="Ficha (aprendiz)">
              <Select value={form.id_class_group} onChange={(e) => set('id_class_group', e.target.value)}>
                <option value="">Sin ficha</option>
                {listaFichas.map((f) => (
                  <option key={f.id} value={f.id}>{f.nombre} · {f.program?.nombre || ''}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <Button type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Agregar al padrón'}
          </Button>
        </form>

        <section className={s.section} aria-label="Cuentas pendientes de activación">
          <h3 className={s.sectionTitle}>Cuentas por activar ({codigos.length})</h3>
          {codigos.length === 0 ? (
            <p className={s.muted}>No hay cuentas pendientes de activación.</p>
          ) : (
            <ul className={s.lista}>
              {codigos.map((c) => (
                <li key={c.id} className={s.item}>
                  <span>
                    <strong>{c.nombre} {c.apellido}</strong> · {c.correo} · {c.rol}
                  </span>
                  <span className={s.itemAcciones}>
                    <Button type="button" size="sm" variant="secondary" onClick={() => regenerar(c.id)}>
                      <ArrowsClockwise size={14} /> Regenerar
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => copiar(c.correo)}>
                      <Copy size={14} /> Correo
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={s.section} aria-label="Identidades del padrón">
          <h3 className={s.sectionTitle}>Identidades ({identidades.length})</h3>
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo o documento"
            aria-label="Buscar en el padrón"
          />
          <ul className={s.lista}>
            {identidades.map((i) => (
              <li key={i.id} className={s.item}>
                <span>
                  <strong>{i.nombre} {i.apellido}</strong> · {i.tipo_documento} {i.numero_documento} · {i.correo} · {i.rol}
                  {i.id_usuario ? ' · cuenta creada' : ' · sin registrar'}
                </span>
                {!i.id_usuario && (
                  <Button type="button" size="sm" variant="dangerGhost" onClick={() => quitar(i.id)}>
                    <Trash size={14} /> Retirar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </ApiState>
    </DataPanel>
  )
}
