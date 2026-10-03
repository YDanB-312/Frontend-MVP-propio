import { useEffect } from 'react'

// Título de la pestaña por vista (WCAG 2.4.2). Sufijo único de la app para que
// varias pestañas abiertas se distingan entre sí.
export function useDocumentTitle(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ProyecTwin SENA` : 'ProyecTwin SENA'
  }, [titulo])
}
