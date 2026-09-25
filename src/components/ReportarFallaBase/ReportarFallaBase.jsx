import { useState } from 'react'
import { Bug, PaperPlaneRight } from 'phosphor-react'
import PageHeader from '../PageHeader/PageHeader'
import DataPanel from '../DataPanel/DataPanel'
import ConsoleCard from '../ConsoleCard/ConsoleCard'
import FormField from '../FormField/FormField'
import Actions from '../Actions/Actions'
import Button from '../Button/Button'
import { Input, Textarea, Select } from '../Input/Input'
import Alert from '../Alert/Alert'
import s from './ReportarFallaBase.module.css'

export default function ReportarFallaBase({ role, onSubmit }) {
  // La prioridad no la elige el usuario: el panel la deriva del tipo de falla.
  const [form, setForm] = useState({ titulo: '', descripcion: '', tipo: 'bug_ui' })
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
      setError(err?.data?.message || err?.message || 'No se pudo enviar el reporte. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className={s.wrapper}>
        <DataPanel title="Reporte enviado" icon={<Bug size={18} />}>
          <div className={s.success}>
            <p className={s.successTitle}>¡Gracias por reportar!</p>
            <p className={s.successMsg}>Tu reporte ha sido registrado y será revisado por un administrador.</p>
          </div>
        </DataPanel>
      </div>
    )
  }

  return (
    <div className={s.wrapper}>
      <PageHeader title="Reportar Falla" subtitle={`Reporta un problema que encuentres como ${role}`} icon={<Bug size={20} />} />

      <ConsoleCard title="Detalles de la falla" subtitle="Describe lo ocurrido con el mayor detalle posible" glow>
        <form className={s.form} onSubmit={handleSubmit}>
          <FormField label="Título del reporte" required>
            <Input type="text" value={form.titulo} onChange={handleChange('titulo')} placeholder="Ej: Error al cargar proyectos" required />
          </FormField>

          <FormField label="Descripción" required>
            <Textarea value={form.descripcion} onChange={handleChange('descripcion')} placeholder="Describe el problema con el mayor detalle posible..." rows={5} required />
          </FormField>

          <FormField label="Tipo de falla">
            <Select value={form.tipo} onChange={handleChange('tipo')}>
              <option value="bug_ui">Bug de UI</option>
              <option value="error_datos">Error de datos</option>
              <option value="rendimiento">Rendimiento</option>
              <option value="seguridad">Seguridad</option>
              <option value="otro">Otro</option>
            </Select>
          </FormField>

          {error && <Alert variant="danger">{error}</Alert>}

          <Actions className={s.actions}>
            <Button size="lg" type="submit" disabled={enviando}>
              <PaperPlaneRight size={16} /> {enviando ? 'Enviando…' : 'Enviar reporte'}
            </Button>
          </Actions>
        </form>
      </ConsoleCard>
    </div>
  )
}
