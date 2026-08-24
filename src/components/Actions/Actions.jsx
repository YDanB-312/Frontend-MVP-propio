import s from './Actions.module.css'

export default function Actions({ align = 'end', wrap = false, form = false, className = '', children, ...props }) {
  const base = form ? s.form : s.actions
  const alignClass = align === 'center' ? s.center : align === 'start' ? s.start : s.end
  return (
    <div className={`${base} ${form ? '' : alignClass} ${wrap && !form ? s.wrap : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}
