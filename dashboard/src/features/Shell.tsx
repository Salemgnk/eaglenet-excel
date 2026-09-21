import { Building2, LayoutDashboard, Package, ShoppingCart, Truck, UserRound, Users } from 'lucide-react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Achats } from './Achats'
import { Clients } from './Clients'
import { Dashboard } from './Dashboard'
import { Employes } from './Employes'
import { Fournisseurs } from './Fournisseurs'
import { Stock } from './Stock'
import { Ventes } from './Ventes'

interface Module {
  path: string
  label: string
  icon: typeof LayoutDashboard
  enabled: boolean
}

const MODULES: Module[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
  { path: '/stock', label: 'Stock', icon: Package, enabled: true },
  { path: '/ventes', label: 'Ventes', icon: ShoppingCart, enabled: true },
  { path: '/clients', label: 'Clients', icon: UserRound, enabled: true },
  { path: '/achats', label: 'Achats', icon: Truck, enabled: true },
  { path: '/fournisseurs', label: 'Fournisseurs', icon: Building2, enabled: true },
  { path: '/employes', label: 'Employés', icon: Users, enabled: true },
]

interface ShellProps {
  siteId: string
  userId: string
}

export function Shell({ siteId, userId }: ShellProps) {
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
          <Route path="/ventes" element={<Ventes siteId={siteId} userId={userId} />} />
          <Route path="/clients" element={<Clients siteId={siteId} userId={userId} />} />
          <Route path="/achats" element={<Achats siteId={siteId} userId={userId} />} />
          <Route path="/fournisseurs" element={<Fournisseurs siteId={siteId} userId={userId} />} />
          <Route path="/employes" element={<Employes siteId={siteId} userId={userId} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  )
}
