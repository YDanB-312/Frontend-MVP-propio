import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { motor as motorApi } from '../lib/recursos'

// Configuración del motor de similitud (umbral + ventana), compartida por toda
// la app para que la CLASIFICACIÓN (A/B/C: alta/media/baja) siga siempre al
// umbral que fija el admin. Sin provider, usa el valor por defecto (65%).
const MotorContext = createContext({
  umbral: 0.30,
  umbralPct: 30,
  meses: 12,
  recargar: () => {},
})

const aConfig = (c) => ({ umbral: Number(c.umbral), meses: Number(c.meses) || 12 })

export function MotorProvider({ children }) {
  const [config, setConfig] = useState({ umbral: 0.30, meses: 12 })

  // Refresca la config (la usa el admin al cambiar el umbral).
  const recargar = useCallback(async () => {
    try {
      const c = await motorApi.obtener()
      if (c && c.umbral != null) setConfig(aConfig(c))
    } catch {
      // Si falla, se mantiene el valor vigente (o el por defecto).
    }
  }, [])

  // Carga inicial al montar.
  useEffect(() => {
    let vivo = true
    motorApi.obtener()
      .then((c) => { if (vivo && c && c.umbral != null) setConfig(aConfig(c)) })
      .catch(() => { /* mantiene el valor por defecto */ })
    return () => { vivo = false }
  }, [])

  return (
    <MotorContext.Provider
      value={{
        umbral: config.umbral,
        umbralPct: Math.round(config.umbral * 100),
        meses: config.meses,
        recargar,
      }}
    >
      {children}
    </MotorContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- useMotor se exporta junto al provider para un único contexto
export function useMotor() {
  return useContext(MotorContext)
}
