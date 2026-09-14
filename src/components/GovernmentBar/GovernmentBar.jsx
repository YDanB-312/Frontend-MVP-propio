import { Sun, Moon } from 'phosphor-react'
import { useTheme } from '../../contexts/useTheme'
import { getConfigMotor } from '../../data/mockData'
import s from './GovernmentBar.module.css'

export default function GovernmentBar() {
  const { theme, alternarTema } = useTheme()
  const motor = getConfigMotor()

  return (
    <div className={s.bar}>
      <div className={s.container}>
        <p className={s.accessibility}>Portal del SENA - República de Colombia</p>
        <p className={`mono ${s.motor}`} aria-label={`Motor de similitud: umbral ${Math.round(motor.umbral * 100)} por ciento, corpus de ${motor.meses} meses`}>
          <span className={s.dot} aria-hidden="true" />
          <span className={s.motorFull}>MOTOR · UMBRAL {Math.round(motor.umbral * 100)}% · CORPUS {motor.meses}M</span>
          <span className={s.motorCorto} aria-hidden="true">UMBRAL {Math.round(motor.umbral * 100)}%</span>
        </p>
        <button
          type="button"
          className={s.themeBtn}
          onClick={alternarTema}
          aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={16} weight="regular" /> : <Moon size={16} weight="regular" />}
        </button>
      </div>
    </div>
  )
}
