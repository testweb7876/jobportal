import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { logoutUser, selectUser, selectUnreadCount, toggleSidebar, selectSidebarOpen, closeSidebar } from '../../store'
import { Avatar } from '../../components/common'
import { useIsMobile } from '../../hooks'

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  home:      'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  jobs:      'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  apps:      'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  resume:    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  company:   'M3 21h18M9 21V7l7-4v18',
  chat:      'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  bell:      'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  users:     'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  settings:  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  logout:    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  analytics: 'M18 20V10M12 20V4M6 20v-6',
  search:    'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  heart:     'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  folder:    'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  star:      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  briefcase: 'M20 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  package:   'M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12',
}

// ── Sidebar nav items ──────────────────────────────────────────────────────
const jobseekerNav = [
  { to: '/jobseeker',              label: 'Dashboard',     icon: 'home' },
  { to: '/jobseeker/jobs',         label: 'Find Jobs',     icon: 'search' },
  { to: '/jobseeker/applications', label: 'Applications',  icon: 'apps' },
  { to: '/jobseeker/saved',        label: 'Saved Jobs',    icon: 'heart' },
  { to: '/jobseeker/resume',       label: 'My Resumes',    icon: 'resume' },
  { to: '/jobseeker/companies',    label: 'Companies',     icon: 'company' },
  { to: '/jobseeker/messages',     label: 'Messages',      icon: 'chat' },
  { to: '/jobseeker/packages',     label: 'Packages',      icon: 'package' },
  { to: '/jobseeker/settings',     label: 'Settings',      icon: 'settings' },
]

const employerNav = [
  { to: '/employer',               label: 'Dashboard',     icon: 'home' },
  { to: '/employer/jobs',          label: 'My Jobs',       icon: 'briefcase' },
  { to: '/employer/jobs/new',      label: 'Post Job',      icon: 'apps' },
  { to: '/employer/applications',  label: 'Applications',  icon: 'folder' },
  { to: '/employer/resumes',       label: 'Search Resumes',icon: 'search' },
  { to: '/employer/company',       label: 'Company',       icon: 'company' },
  { to: '/employer/messages',      label: 'Messages',      icon: 'chat' },
  { to: '/employer/packages',      label: 'Packages',      icon: 'package' },
  { to: '/employer/analytics',     label: 'Analytics',     icon: 'analytics' },
  { to: '/employer/settings',      label: 'Settings',      icon: 'settings' },
]

const adminNav = [
  { to: '/admin',                  label: 'Dashboard',     icon: 'home' },
  { to: '/admin/users',            label: 'Users',         icon: 'users' },
  { to: '/admin/jobs',             label: 'Jobs',          icon: 'briefcase' },
  { to: '/admin/companies',        label: 'Companies',     icon: 'company' },
  { to: '/admin/analytics',        label: 'Analytics',     icon: 'analytics' },
  { to: '/admin/settings',         label: 'Settings',      icon: 'settings' },
]

// ── Sidebar ─────────────────────────────────────────────────────────────────
export const Sidebar = ({ navItems, role }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const isOpen = useSelector(selectSidebarOpen)
  const isMobile = useIsMobile()
  const location = useLocation()

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  const roleColors = {
    jobseeker: 'var(--brand-500)',
    employer:  '#7c3aed',
    admin:     '#dc2626',
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 49 }}
          onClick={() => dispatch(closeSidebar())} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: roleColors[role] || 'var(--brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            </div>
            <span style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
              Job<span style={{ color: roleColors[role] || 'var(--brand-400)' }}>Portal</span>
            </span>
          </Link>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar src={user?.avatar?.secureUrl} name={`${user?.firstName} ${user?.lastName}`} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 11 }}>{role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = location.pathname === item.to || (item.to !== '/'+role && location.pathname.startsWith(item.to))
            return (
              <NavLink key={item.to} to={item.to}
                onClick={() => isMobile && dispatch(closeSidebar())}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10, marginBottom: 2,
                  color: active ? '#fff' : 'rgba(255,255,255,.5)',
                  background: active ? 'rgba(255,255,255,.1)' : 'transparent',
                  textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 400,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => !active && (e.currentTarget.style.background = 'rgba(255,255,255,.05)')}
                onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
              >
                <Icon d={ICONS[item.icon]} size={16} />
                {item.label}
                {item.badge && (
                  <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,.5)',
              fontSize: 14, cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.15)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.5)' }}
          >
            <Icon d={ICONS.logout} size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

// ── Top Header ─────────────────────────────────────────────────────────────
export const TopHeader = ({ title }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const unread = useSelector(selectUnreadCount)
  const user = useSelector(selectUser)

  return (
    <header style={{
      height: 'var(--header-h)', background: '#fff',
      borderBottom: '1px solid var(--gray-200)',
      display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 16, position: 'sticky', top: 0, zIndex: 30,
    }}>
      {/* Hamburger */}
      <button onClick={() => dispatch(toggleSidebar())}
        className="btn btn-ghost btn-sm" style={{ padding: 8 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {title && <h1 style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--gray-900)' }}>{title}</h1>}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Notifications */}
        <button onClick={() => navigate(`/${user?.role === 'jobseeker' ? 'jobseeker' : 'employer'}/notifications`)}
          className="btn btn-ghost btn-sm" style={{ padding: 8, position: 'relative' }}>
          <Icon d={ICONS.bell} size={20} />
          {unread > 0 && (
            <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16,
              background: '#ef4444', borderRadius: '50%', fontSize: 9, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* Avatar */}
        <button onClick={() => navigate(`/${user?.role}/settings`)} style={{ background: 'none', border: 'none' }}>
          <Avatar src={user?.avatar?.secureUrl} name={`${user?.firstName} ${user?.lastName}`} size="sm" />
        </button>
      </div>
    </header>
  )
}

// ── Dashboard Layout ────────────────────────────────────────────────────────
export const DashboardLayout = ({ children, role, pageTitle }) => {
  const navMap = { jobseeker: jobseekerNav, employer: employerNav, admin: adminNav }
  const nav = navMap[role] || jobseekerNav

  return (
    <div className="dashboard-layout">
      <Sidebar navItems={nav} role={role} />
      <div className="main-content">
        <TopHeader title={pageTitle} />
        <div className="content-area animate-in">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Public Navbar ───────────────────────────────────────────────────────────
export const Navbar = () => {
  const user = useSelector(selectUser)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const dashboardPath = user?.role === 'employer' ? '/employer' : user?.role === 'admin' ? '/admin' : '/jobseeker'

  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid var(--gray-200)',
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div className="container" style={{ height: 64, display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>
            Job<span style={{ color: 'var(--brand-600)' }}>Portal</span>
          </span>
        </Link>

        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {[{ to: '/jobs', label: 'Find Jobs' }, { to: '/companies', label: 'Companies' }].map(link => (
            <NavLink key={link.to} to={link.to}
              style={({ isActive }) => ({
                padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                color: isActive ? 'var(--brand-600)' : 'var(--gray-600)',
                background: isActive ? 'var(--brand-50)' : 'transparent',
                textDecoration: 'none', transition: 'all .15s',
              })}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {user ? (
            <button onClick={() => navigate(dashboardPath)} className="btn btn-primary btn-sm">
              Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

// ── Protected Route ─────────────────────────────────────────────────────────
export { default as ProtectedRoute } from './ProtectedRoute'
