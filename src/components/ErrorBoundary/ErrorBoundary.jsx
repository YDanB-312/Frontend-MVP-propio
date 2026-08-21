import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh',padding:'2rem',fontFamily:'var(--font)'}}>
          <div style={{textAlign:'center',maxWidth:440}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>&#9888;</div>
            <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Algo salió mal</h2>
            <p style={{color:'var(--c-text-2)',marginBottom:'1.5rem'}}>{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()} style={{padding:'8px 24px',background:'var(--c-primary)',color:'#fff',border:'none',borderRadius:'var(--r-md)',fontWeight:600,cursor:'pointer'}}>Recargar</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
