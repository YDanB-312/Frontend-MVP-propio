import { useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import FormField from '../../../components/FormField/FormField'
import { Input, Select } from '../../../components/Input/Input'
import DataTable from '../../../components/DataTable/DataTable'
import Badge from '../../../components/Badge/Badge'
import ApiState from '../../../components/ApiState/ApiState'
import { useApi } from '../../../lib/useApi'
import { auditoria } from '../../../lib/recursos'
import { formatearFecha } from '../../../utils/helpers'
import { ClockCounterClockwise } from 'phosphor-react'

const ACCIONES = [
  ['', 'Todas'],
  ['crear_usuario', 'Crear usuario'],
  ['actualizar_usuario', 'Actualizar usuario'],
  ['eliminar_usuario', 'Eliminar usuario'],
  ['cambiar_correo', 'Cambiar correo'],
  ['revisar_propuesta', 'Revisar propuesta'],
  ['archivar_ficha', 'Archivar ficha'],
  ['eliminar_ficha', 'Eliminar ficha'],
  ['config_motor', 'Configurar motor'],
  ['recalibrar_motor', 'Recalibrar motor'],
]

const ENTIDADES = [
  ['', 'Todas'],
  ['general_users', 'Usuarios'],
  ['projects', 'Propuestas'],
  ['class_groups', 'Fichas'],
  ['similarities', 'Similitudes'],
  ['motor_configs', 'Motor'],
]

function detalleTexto(detalle) {
  if (!detalle || typeof detalle !== 'object') return '—'
  return Object.entries(detalle)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join(' · ')
}

export default function Bitacora() {
  const [accion, setAccion] = useState('')
  const [entidad, setEntidad] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const { data, cargando, error, recargar } = useApi(
    () => auditoria.listar({ accion, entidad, desde, hasta }),
    [accion, entidad, desde, hasta],
    { inicial: [] }
  )

  const filas = data || []

  const columnas = [
    {
      key: 'created_at',
      header: 'Fecha',
      render: (r) => formatearFecha(r.created_at),
    },
    {
      key: 'usuario',
      header: 'Responsable',
      render: (r) => (r.user ? `${r.user.nombre} ${r.user.apellido || ''}`.trim() : 'Sistema'),
    },
    {
      key: 'accion',
      header: 'Acción',
      render: (r) => <Badge variant="neutral">{r.accion}</Badge>,
    },
    {
      key: 'entidad',
      header: 'Entidad',
      render: (r) => (r.entidad ? `${r.entidad}${r.entidad_id ? ` #${r.entidad_id}` : ''}` : '—'),
    },
    {
      key: 'detalle',
      header: 'Detalle',
      render: (r) => detalleTexto(r.detalle),
    },
  ]

  return (
    <DashboardLayout role="admin" titulo="Bitácora">
      <PageHeader
        title="Bitácora de acciones"
        subtitle="Registro inmutable de las acciones sensibles (quién, qué y cuándo)."
        icon={<ClockCounterClockwise />}
        breadcrumb={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Bitácora' },
        ]}
      />

      <FilterBar title="Filtrar bitácora">
        <FormField label="Acción">
          <Select value={accion} onChange={(e) => setAccion(e.target.value)}>
            {ACCIONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </FormField>
        <FormField label="Entidad">
          <Select value={entidad} onChange={(e) => setEntidad(e.target.value)}>
            {ENTIDADES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </FormField>
        <FormField label="Desde">
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </FormField>
        <FormField label="Hasta">
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </FormField>
      </FilterBar>

      <ApiState cargando={cargando} error={error} onReintentar={recargar}>
        <DataTable
          ariaLabel="Bitácora de acciones"
          columns={columnas}
          rows={filas}
          keyOf={(r) => r.id}
          empty="Sin acciones registradas para este filtro."
        />
      </ApiState>
    </DashboardLayout>
  )
}
