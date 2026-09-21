import { LayoutDashboard, Package, ShoppingCart, Truck, Users } from 'lucide-react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import { Stock } from './Stock'

interface Module {
  path: string
  label: string
  icon: typeof LayoutDashboard
  enabled: boolean
}

const MODULES: Module[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
  { path: '/stock', label: 'Stock', icon: Package, enabled: true },
  { path: '/ventes', label: 'Ventes', icon: ShoppingCart, enabled: false },
  { path: '/achats', label: 'Achats', icon: Truck, enabled: false },
  { path: '/employes', label: 'Employés', icon: Users, enabled: false },
]

interface ShellProps {
  siteId: string
}

export function Shell({ siteId }: ShellProps) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">Eaglenet</div>
        <nav className="sidebar-nav">
          {MODULES.map((m) => {
            const Icon = m.icon
            if (!m.enabled) {
              return (
                <div key={m.path} className="sidebar-item disabled" aria-disabled="true">
                  <span className="sidebar-item-main">
                    <Icon size={18} strokeWidth={2} />
                    <span>{m.label}</span>
                  </span>
                  <span className="sidebar-soon">Bientôt</span>
                </div>
              )
            }
            return (
              <NavLink
                key={m.path}
                to={m.path}
                className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{m.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="shell-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard siteId={siteId} />} />
          <Route path="/stock" element={<Stock siteId={siteId} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  )
}
