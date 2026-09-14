import { useCallback, useEffect, useState } from 'react'
import { THEME_KEY, ThemeContext } from './theme'

// Dark-first: sin preferencia guardada se arranca en consola oscura.
function temaInicial() {
  try {
    const guardado = localStorage.getItem(THEME_KEY)
    if (guardado === 'light' || guardado === 'dark') return guardado
  } catch {
    // almacenamiento no disponible
  }
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(temaInicial)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // almacenamiento no disponible
    }
  }, [theme])

  const alternarTema = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    []
  )

  return (
    <ThemeContext.Provider value={{ theme, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  )
}
