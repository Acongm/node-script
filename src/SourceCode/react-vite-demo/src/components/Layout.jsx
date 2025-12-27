import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/', label: '首页' },
  { path: '/key-anti-pattern', label: '01-Key反模式' },
  { path: '/memo-optimization', label: '02-性能优化' },
  { path: '/concurrent-features', label: '03-React18' },
  { path: '/react19-features', label: '04-React19' },
  { path: '/fiber-visualization', label: '05-Fiber架构' },
  { path: '/performance-comparison', label: '06-性能对比' },
]

function Layout({ children }) {
  return (
    <>
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-title">⚛️ React 核心原理示例</div>
          <div className="nav-links">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end={item.path === '/'}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <div className="container">
        {children}
      </div>
    </>
  )
}

export default Layout
