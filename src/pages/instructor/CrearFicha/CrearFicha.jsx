import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowClockwise, Books, ChartBar, CheckCircle, Code, Plus } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import FormField from '../../../components/FormField/FormField'
import Actions from '../../../components/Actions/Actions'
import Button from '../../../components/Button/Button'
import { Input, Select, Textarea } from '../../../components/Input/Input'
import { useAuth } from '../../../contexts/AuthContext'
import { createFicha, generarCodigoFicha } from '../../../data/mockData'
import s from './CrearFicha.module.css'

const PROGRAMAS = [
  'ADSO',
  'Produccion Multimedia',
  'Infraestructura Redes',
  'Contabilidad y Finanzas',
  'Otro',
]

export default function CrearFicha() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState(() => generarCodigoFicha())
  const [form, setForm] = useState({ nombre: '', programa: '', horario: 'manana', descripcion: '' })
  const [errores, setErrores] = useState({})

  const horarioLabel = useMemo(
    () => (form.horario === 'manana' ? 'Lunes a Viernes · Mañana (6:00–12:00)' : 'Lunes a Viernes · Tarde (12:00–18:00)'),
    [form.horario]
  )

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((err) => ({ ...err, [name]: undefined }))
  }

  const regenerarCodigo = () => setCodigo(generarCodigoFicha())

  const validar = () => {
    const err = {}
    if (!form.nombre.trim()) err.nombre = 'El nombre de la ficha es obligatorio.'
    if (!form.programa) err.programa = 'Selecciona un programa de formación.'
    return err
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    createFicha({
      nombre: form.nombre.trim(),
      programa: form.programa,
      instructorName: user?.nombre || '',
      instructorId: Number(user?.id) || null,
    })
    navigate('/instructor/gestionar-fichas')
  }

  return (
    <DashboardLayout role="instructor" titulo="Crear Ficha">
      <div className={s.page}>
        <PageHeader
          title="Crear Ficha"
          subtitle="Registra una nueva ficha de formación y queda asignado como su instructor."
          icon={<Plus />}
          breadcrumb={[
            { label: 'Dashboard', to: '/instructor/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Gestionar Fichas', to: '/instructor/gestionar-fichas', icon: <Books size={14} /> },
            { label: 'Crear Ficha' },
          ]}
        />

        <DataPanel title="Datos de la ficha" icon={<Books />}>
          <form className={s.form} onSubmit={onSubmit} noValidate>
            <FormField label="Nombre de la ficha" required error={errores.nombre}>
              <Input
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                placeholder="Ej. Análisis y Desarrollo 2718"
                maxLength={80}
              />
            </FormField>
            </FormField>

            <FormField label="Programa de formación" required error={errores.programa}>
              <Select
                name="programa"
                value={form.programa}
                onChange={onChange}
              >
                <option value="">Selecciona un programa…</option>
                {PROGRAMAS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Código de la ficha"
              help="El sistema genera un código único automáticamente. Los aprendices lo usarán para unirse."
            >
              <div className={s.codigoRow}>
                <code className={s.codigo}>{codigo}</code>
                <Button type="button" variant="ghost" onClick={regenerarCodigo}>
                  <ArrowClockwise size={14} /> Regenerar
                </Button>
              </div>
            </FormField>

            <FormField label="Horario" help={`Jornada seleccionada: ${horarioLabel}`}>
              <Select
                name="horario"
                value={form.horario}
                onChange={onChange}
              >
                <option value="manana">Lunes a Viernes · Mañana (6:00–12:00)</option>
                <option value="tarde">Lunes a Viernes · Tarde (12:00–18:00)</option>
              </Select>
            </FormField>

            <FormField label="Descripción" help="Opcional. Describe el enfoque o jornada de la ficha.">
              <Textarea
                name="descripcion"
                rows={4}
                value={form.descripcion}
                onChange={onChange}
                placeholder="Ej. Ficha enfocada en desarrollo de software con énfasis en proyectos productivos…"
              />
            </FormField>

            <Actions form>
              <Button type="submit">
                <CheckCircle size={14} /> Crear ficha
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/instructor/gestionar-fichas')}
              >
                Cancelar
              </Button>
            </Actions>
          </form>
        </DataPanel>
      </div>
    </DashboardLayout>
  )
}
