import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Lifebuoy, PaperPlaneRight } from 'phosphor-react'
import PageHeader from '../PageHeader/PageHeader'
import DataPanel from '../DataPanel/DataPanel'
import ConsoleCard from '../ConsoleCard/ConsoleCard'
import FormField from '../FormField/FormField'
import Actions from '../Actions/Actions'
import Button from '../Button/Button'
import { Input, Textarea, Select } from '../Input/Input'
import Alert from '../Alert/Alert'
import s from './ReportarFallaBase.module.css'

// Bandeja de soporte: conflictos con fichas (número, motivo), errores y dudas.
// Si llega ?numero=... desde el formulario de fichas, se precarga el caso.
export default function ReportarFallaBase({ role, onSubmit }) {
  const [searchParams] = useSearchParams()
  const numeroInicial = (searchParams.get('numero') || '').trim()

  const [form, setForm] = useState({
    titulo: '',
    numero_ficha: numeroInicial,
    motivo: numeroInicial ? 'El número ya está registrado en otra ficha.' : '',
    descripcion: '',
    tipo: numeroInicial ? 'otro' : 'bug_ui',
  })
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    setError('')
    try {
      await onSubmit?.(form)
      setEnviado(true)
    } catch (err) {
      // Un fallo de red/validación no debe fingir éxito ni permitir reenvíos.
      setError(err?.data?.message || err?.message || 'No se pudo enviar la solicitud. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className={s.wrapper}>
        <DataPanel title="Solicitud enviada" icon={<Lifebuoy size={18} />}>
          <div className={s.success}>
            <p className={s.successTitle}>¡Gracias por escribirnos!</p>
            <p className={s.successMsg}>Tu solicitud fue registrada y será revisada por un administrador.</p>
          </div>
        </DataPanel>
      </div>
    )
  }

  return (
    <div className={s.wrapper}>
      <PageHeader
        title="Soporte"
        subtitle={`Cuéntanos qué necesitas como ${role}: conflictos con fichas, errores o dudas.`}
        icon={<Lifebuoy size={20} />}
      />

      <ConsoleCard title="Detalles de la solicitud" subtitle="Describe el caso con el mayor detalle posible" glow>
        <form className={s.form} onSubmit={handleSubmit}>
          <FormField label="Número de ficha" help="Opcional. Úsalo si el caso es sobre una ficha (por ejemplo, un número ocupado).">
            <Input
              type="text"
              inputMode="numeric"
              value={form.numero_ficha}
              onChange={handleChange('numero_ficha')}
              placeholder="Ej: 3142101"
              maxLength={30}
            />
          </FormField>

          <FormField label="Motivo" help="Resumen corto del caso.">
            <Input
              type="text"
              value={form.motivo}
              onChange={handleChange('motivo')}
              placeholder="Ej: el número ya está registrado"
              maxLength={120}
            />
          </FormField>

          <FormField label="Título de la solicitud" help="Opcional: si lo dejas vacío y hay número de ficha, se genera automáticamente.">
            <Input
              type="text"
              value={form.titulo}
              onChange={handleChange('titulo')}
              placeholder="Ej: Necesito crear la ficha 3142101"
              maxLength={255}
            />
          </FormField>

          <FormField label="Descripción" required>
            <Textarea
              value={form.descripcion}
              onChange={handleChange('descripcion')}
              placeholder="Describe el caso con el mayor detalle posible..."
              rows={5}
              required
            />
          </FormField>

          <FormField label="Tipo de solicitud">
            <Select value={form.tipo} onChange={handleChange('tipo')}>
              <option value="bug_ui">Error de interfaz</option>
              <option value="error_datos">Error de datos</option>
              <option value="rendimiento">Rendimiento</option>
              <option value="seguridad">Seguridad</option>
              <option value="otro">Otro (fichas, dudas, solicitudes)</option>
            </Select>
          </FormField>

          {error && <Alert variant="danger">{error}</Alert>}

          <Actions className={s.actions}>
            <Button size="lg" type="submit" disabled={enviando}>
              <PaperPlaneRight size={16} /> {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </Button>
          </Actions>
        </form>
      </ConsoleCard>
    </div>
  )
}
