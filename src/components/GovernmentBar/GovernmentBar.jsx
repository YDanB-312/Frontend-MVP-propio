import { Sun, Moon } from 'phosphor-react'
import { useTheme } from '../../contexts/useTheme'
import { useApi } from '../../lib/useApi'
import { motor as apiMotor } from '../../lib/recursos'
import Tooltip from '../Tooltip/Tooltip'
import s from './GovernmentBar.module.css'

export default function GovernmentBar() {
  const { theme, alternarTema } = useTheme()

  // Configuración del motor de similitudes (endpoint público de solo lectura).
  const { data: motor, error } = useApi(() => apiMotor.obtener(), [])
  const umbralPct = motor ? Math.round(Number(motor.umbral) * 100) : null
  const etiquetaMotor = error
    ? 'MOTOR · NO DISPONIBLE'
    : umbralPct != null
      ? `MOTOR · UMBRAL ${umbralPct}% · CORPUS ${motor.meses}M`
      : 'MOTOR · CONECTANDO…'

  return (
    <div className={s.bar}>
      <div className={s.container}>
        <p className={s.accessibility}>Portal del SENA - República de Colombia</p>
        <p
          className={`mono ${s.motor}`}
          aria-label={
            umbralPct != null
              ? `Motor de similitud: umbral ${umbralPct} por ciento, corpus de ${motor.meses} meses`
              : 'Motor de similitud'
          }
        >
          <span className={s.dot} aria-hidden="true" />
          <span className={s.motorFull}>{etiquetaMotor}</span>
          <span className={s.motorCorto} aria-hidden="true">
            {umbralPct != null ? `UMBRAL ${umbralPct}%` : 'MOTOR'}
          </span>
        </p>
        <Tooltip content={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
          <button
            type="button"
            className={s.themeBtn}
            onClick={alternarTema}
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={16} weight="regular" /> : <Moon size={16} weight="regular" />}
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
