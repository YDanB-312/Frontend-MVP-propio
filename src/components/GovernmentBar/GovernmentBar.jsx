import { useEffect, useState } from 'react'
import { Sun, Moon } from 'phosphor-react'
import s from './GovernmentBar.module.css'

const THEME_KEY = 'theme'

export default function GovernmentBar() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const alternarTema = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <div className={s.bar}>
      <div className={s.container}>
        <p className={s.accessibility}>Portal del SENA - República de Colombia</p>
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
