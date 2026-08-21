import { useState } from 'react'
import { Bug, PaperPlaneRight } from 'phosphor-react'
import PageHeader from '../PageHeader/PageHeader'
import DataPanel from '../DataPanel/DataPanel'
import FormField from '../FormField/FormField'
import s from './ReportarFallaBase.module.css'

export default function ReportarFallaBase({ role, onSubmit }) {
  const [form, setForm] = useState({ titulo: '', descripcion: '', tipo: 'bug_ui', prioridad: 'media' })
  const [enviado, setEnviado] = useState(false)

  const handleChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.(form)
    setEnviado(true)
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

      <DataPanel title="Detalles de la falla" icon={<Bug size={18} />}>
        <form className={s.form} onSubmit={handleSubmit}>
          <FormField label="Título del reporte" required>
            <input type="text" value={form.titulo} onChange={handleChange('titulo')} placeholder="Ej: Error al cargar proyectos" className={s.input} required />
          </FormField>

          <FormField label="Descripción" required>
            <textarea value={form.descripcion} onChange={handleChange('descripcion')} placeholder="Describe el problema con el mayor detalle posible..." className={s.textarea} rows={5} required />
          </FormField>

          <div className={s.row}>
            <FormField label="Tipo de falla">
              <select value={form.tipo} onChange={handleChange('tipo')} className={s.select}>
                <option value="bug_ui">Bug de UI</option>
                <option value="error_datos">Error de datos</option>
                <option value="rendimiento">Rendimiento</option>
                <option value="seguridad">Seguridad</option>
                <option value="otro">Otro</option>
              </select>
            </FormField>
            <FormField label="Prioridad">
              <select value={form.prioridad} onChange={handleChange('prioridad')} className={s.select}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </FormField>
          </div>

          <div className={s.actions}>
            <button type="submit" className={s.btnPrimary}><PaperPlaneRight size={16} /> Enviar reporte</button>
          </div>
        </form>
      </DataPanel>
    </div>
  )
}
