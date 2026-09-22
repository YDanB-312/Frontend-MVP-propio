import { useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import DataTable from '../../../components/DataTable/DataTable'
import ApiState from '../../../components/ApiState/ApiState'
import Alert from '../../../components/Alert/Alert'
import Badge from '../../../components/Badge/Badge'
import { Select } from '../../../components/Input/Input'
import { UsersThree } from 'phosphor-react'
import { useApi } from '../../../lib/useApi'
import { admins as apiAdmins, centros } from '../../../lib/recursos'

function nombre(u) {
  if (!u) return '—'
  return [u.nombre, u.apellido].filter(Boolean).join(' ').trim() || u.correo || '—'
}

// Gobernanza (solo superadmin): asigna cada coordinador a su centro. Un centro
// admite un único administrador; el backend lo valida.
export default function AdministradoresAdmin() {
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [listaAdmins, listaCentros] = await Promise.all([apiAdmins.listar(), centros.listar()])
      return { listaAdmins, listaCentros }
    },
    [],
    { inicial: null }
  )

  const [aviso, setAviso] = useState('')
  const [errorAviso, setErrorAviso] = useState('')
  const [guardando, setGuardando] = useState(null)

  const listaAdmins = data?.listaAdmins || []
  const listaCentros = data?.listaCentros || []

  async function asignar(admin, centroId) {
    setAviso('')
    setErrorAviso('')
    setGuardando(admin.id)
    try {
      await apiAdmins.asignarCentro(admin.id, centroId ? Number(centroId) : null)
      setAviso('Centro actualizado.')
      await recargar()
    } catch (err) {
      setErrorAviso(err?.data?.message || 'No fue posible asignar el centro.')
    } finally {
      setGuardando(null)
    }
  }

  const columnas = [
    {
      key: 'admin',
      header: 'Administrador',
      render: (a) => (
        <span>
          <strong>{nombre(a.generalUser)}</strong>
          <br />
          <small>{a.generalUser?.correo || ''}</small>
        </span>
      ),
    },
    {
      key: 'centro',
      header: 'Centro actual',
      render: (a) => a.trainingCenter?.name || <Badge variant="warning">Sin centro</Badge>,
    },
    {
      key: 'asignar',
      header: 'Asignar centro',
      render: (a) => (
        <Select
          value={a.training_center_id ?? ''}
          disabled={guardando === a.id}
          onChange={(e) => asignar(a, e.target.value)}
          aria-label={`Centro de ${nombre(a.generalUser)}`}
        >
          <option value="">Sin centro (global)</option>
          {listaCentros.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      ),
    },
  ]

  return (
    <DashboardLayout role="superadmin" titulo="Administradores">
      <div>
        <PageHeader
          title="Administradores"
          subtitle="Asigna cada coordinador a su centro de formación (un administrador por centro)."
          icon={<UsersThree />}
        />

        {aviso && <Alert variant="success">{aviso}</Alert>}
        {errorAviso && <Alert variant="danger">{errorAviso}</Alert>}

        <DataPanel title="Coordinadores" icon={<UsersThree />}>
          {cargando ? (
            <ApiState cargando />
          ) : error ? (
            <ApiState error={error} onReintentar={recargar} />
          ) : (
            <DataTable
              columns={columnas}
              rows={listaAdmins}
              ariaLabel="Administradores"
              empty="Sin administradores registrados."
            />
          )}
        </DataPanel>
      </div>
    </DashboardLayout>
  )
}
