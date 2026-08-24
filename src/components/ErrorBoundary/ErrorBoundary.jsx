import { Component } from 'react'
import s from './ErrorBoundary.module.css'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallbackRender === 'function') {
        return this.props.fallbackRender(this.state.error)
      }
      return (
        <div className={s.wrapper}>
          <div className={s.content}>
            <div className={s.icon}>⚠️</div>
            <h2 className={s.title}>Algo salió mal</h2>
            <p className={s.message}>{this.state.error?.message}</p>
            <button className={s.btn} onClick={() => window.location.reload()}>Recargar</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
