import ErrorBoundary from '../ErrorBoundary/ErrorBoundary'
import { useNavigate } from 'react-router-dom'

export default function SafeRoute({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}
