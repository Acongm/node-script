function DemoSection({ title, type = 'default', children }) {
  const className = `demo-section ${type}`
  
  return (
    <div className={className}>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  )
}

export default DemoSection

