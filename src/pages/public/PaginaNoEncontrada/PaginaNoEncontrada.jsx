import LandingLayout from '../../../layouts/LandingLayout/LandingLayout'
import Actions from '../../../components/Actions/Actions'
import Button from '../../../components/Button/Button'
import s from './PaginaNoEncontrada.module.css'

export default function PaginaNoEncontrada() {
  return (
    <LandingLayout>
      <main className={s.wrapper}>
        <div className={s.card}>
          <p className={s.code} aria-hidden="true">
            404
          </p>
          <h1 className={s.title}>Página no encontrada</h1>
          <p className={s.message}>
            Lo sentimos, la página que buscas no existe o fue movida. Verifica la dirección o vuelve al inicio.
          </p>
          <Actions align="center" wrap className={s.actions}>
            <Button as="link" to="/">
              Volver al inicio
            </Button>
            <Button as="link" to="/login" variant="secondary">
              Iniciar sesión
            </Button>
          </Actions>
        </div>
      </main>
    </LandingLayout>
  )
}
