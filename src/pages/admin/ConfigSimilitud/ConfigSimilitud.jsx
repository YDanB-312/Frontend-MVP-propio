import { useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import ConsoleCard from '../../../components/ConsoleCard/ConsoleCard'
import StatChip from '../../../components/StatChip/StatChip'
import FormField from '../../../components/FormField/FormField'
import Alert from '../../../components/Alert/Alert'
import Button from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import Actions from '../../../components/Actions/Actions'
import { ChartBar, CheckCircle, SlidersHorizontal, ArrowClockwise, Gauge, Database, MagnifyingGlass } from 'phosphor-react'
import {
  getConfigMotor,
  setUmbralSimilitud,
  setMesesCorpus,
  recalcularSimilitudes,
  getSimilitudesValidas,
} from '../../../data/mockData'
import s from './ConfigSimilitud.module.css'

export default function ConfigSimilitud() {
  const cfg = getConfigMotor()
  const [umbral, setUmbral] = useState(() => Math.round(cfg.umbral * 100))
  const [meses, setMeses] = useState(() => cfg.meses)
  const [errores, setErrores] = useState({})
  const [msg, setMsg] = useState(null)
  const [, setTick] = useState(0)
  const refrescar = () => setTick((t) => t + 1)

  const vigente = getConfigMotor()

  const guardar = (e) => {
    e.preventDefault()
    const errs = {}
    const u = Number(umbral)
    const m = Math.round(Number(meses))
    if (!Number.isFinite(u) || u < 5 || u > 95) errs.umbral = 'Ingresa un porcentaje entre 5 y 95.'
    if (!Number.isFinite(m) || m < 1 || m > 60) errs.meses = 'Ingresa entre 1 y 60 meses.'
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    const okU = setUmbralSimilitud(u / 100)
    const okM = setMesesCorpus(m)
    if (okU && okM) {
      setMsg(`Motor actualizado: umbral ${u}% y ventana de ${m} meses. Aplica a las próximas detecciones; usa Recalcular para la base existente.`)
    } else {
      setErrores({ umbral: 'No fue posible guardar la configuración.' })
    }
    refrescar()
  }

  const recalcular = () => {
    const { eliminadas, creadas } = recalcularSimilitudes()
    setMsg(`Recalibración lista: ${eliminadas} coincidencia(s) fuera de regla eliminadas, ${creadas} nueva(s) detectada(s).`)
    refrescar()
  }

  return (
    <DashboardLayout role="admin" titulo="Motor de Similitudes">
      <div className={s.page}>
        <PageHeader
          title="Motor de similitudes"
          subtitle={`Umbral vigente: ${Math.round(vigente.umbral * 100)}% · Ventana: ${vigente.meses} meses.`}
          icon={<SlidersHorizontal />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Motor de similitudes' },
          ]}
        />

        {msg && (
          <Alert><CheckCircle size={14} /> {msg}</Alert>
        )}

        <div className={s.readout} role="status" aria-label="Lectura vigente del motor">
          <StatChip icon={<Gauge size={14} />} label="Umbral" value={`${Math.round(vigente.umbral * 100)}%`} />
          <StatChip icon={<Database size={14} />} label="Ventana" value={`${vigente.meses}M`} />
          <StatChip icon={<MagnifyingGlass size={14} />} label="Coincidencias" value={getSimilitudesValidas().length} />
        </div>

        <div className={s.grid}>
          <ConsoleCard title="Parámetros de detección" subtitle="Aplica a las próximas detecciones" glow>
            <form className={s.form} onSubmit={guardar} noValidate>
              <FormField
                label="Porcentaje límite de coincidencia"
                required
                error={errores.umbral}
                help="Se alerta si una propuesta supera este porcentaje frente a otra del mismo programa."
              >
                <Input
                  type="number"
                  min={5}
                  max={95}
                  value={umbral}
                  onChange={(e) => setUmbral(e.target.value)}
                />
              </FormField>
              <FormField
                label="Antigüedad máxima del corpus (meses)"
                required
                error={errores.meses}
                help="Las propuestas más viejas siguen en el historial, pero dejan de generar coincidencias."
              >
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={meses}
                  onChange={(e) => setMeses(e.target.value)}
                />
              </FormField>
              <Actions form>
                <Button type="submit">
                  <CheckCircle size={14} /> Guardar parámetros
                </Button>
                <Button type="button" variant="secondary" onClick={recalcular}>
                  <ArrowClockwise size={14} /> Recalcular base existente
                </Button>
              </Actions>
            </form>
          </ConsoleCard>

          <ConsoleCard title="Base de comparación">
            <p className={s.baseText}>
              El motor compara cada propuesta contra las <strong>propuestas vigentes (pendientes y
              aprobadas)</strong> del mismo programa de los últimos <strong>{vigente.meses} meses</strong>, con{' '}
              <strong>{getSimilitudesValidas().length} coincidencia(s) válida(s)</strong> a la fecha.
              Así aprobar siempre sigue siendo posible aunque la base crezca.
            </p>
            <p className={`mono ${s.pipeline}`}>propuestas → TF-IDF + coseno → umbral {Math.round(vigente.umbral * 100)}% → coincidencias</p>
          </ConsoleCard>
        </div>
      </div>
    </DashboardLayout>
  )
}
