import { useCallback, useSyncExternalStore } from 'react'

// Consulta de media reactiva (p. ej. para decidir si el sidebar es un drawer
// modal en móvil o una columna fija en escritorio).
export function useMediaQuery(query) {
  const suscribir = useCallback((alCambiar) => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', alCambiar)
    return () => mq.removeEventListener('change', alCambiar)
  }, [query])

  const obtener = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(suscribir, obtener, () => false)
}
