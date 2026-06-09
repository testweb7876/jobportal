import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store, fetchMe, selectInitialized, selectUser } from './store'
import { ProtectedRoute } from './components/layout'
import { Spinner } from './components/common'
import './styles/global.css'

// ── Public Pages ───────────────────────────────────────────────────────────
import { HomePage, JobsPage, JobDetailPage, CompaniesPage } from './pages/public'
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './pages/auth'

// ── Jobseeker Pages ────────────────────────────────────────────────────────
import {
  JobseekerDashboard, MyApplicationsPage, MyResumesPage,
  NotificationsPage, PackagesPage,
} from './pages/jobseeker'

// ── Employer Pages ─────────────────────────────────────────────────────────
import {
  EmployerDashboard, PostJobPage, MyJobsPage,
  ApplicantsPage, CompanyProfilePage, ResumeSearchPage,
} from './pages/employer'

// ── Admin Pages ────────────────────────────────────────────────────────────
import { AdminDashboard, AdminUsersPage, AdminJobsPage } from './pages/admin'

// ── App initializer ────────────────────────────────────────────────────────
const AppInitializer = ({ children }) => {
  const dispatch = useDispatch()
  const initialized = useSelector(selectInitialized)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      dispatch(fetchMe())
    } else {
      dispatch({ type: 'auth/fetchMe/rejected' })
    }
  }, [dispatch])

  if (!initialized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <Spinner size={28} />
        </div>
      </div>
    )
  }

  return children
}

// ── 404 Page ───────────────────────────────────────────────────────────────
const NotFoundPage = () => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--gray-50)' }}>
    <div style={{ fontSize: 80 }}>🔍</div>
    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--gray-800)' }}>404</h1>
    <p style={{ color: 'var(--gray-500)', fontSize: 18 }}>Page not found</p>
    <a href="/" className="btn btn-primary btn-lg" style={{ marginTop: 8 }}>Go Home</a>
  </div>
)

// ── Smart Redirect ─────────────────────────────────────────────────────────
const SmartRedirect = () => {
  const user = useSelector(selectUser)
  if (!user) return <Navigate to="/login" replace />
  const map = { jobseeker: '/jobseeker', employer: '/employer', admin: '/admin' }
  return <Navigate to={map[user.role] || '/jobseeker'} replace />
}

// ── Main App ───────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <BrowserRouter>
    <AppInitializer>
      <Routes>
        {/* ── Public ─────────────────────────────────────────────────── */}
        <Route path="/"           element={<HomePage />} />
        <Route path="/jobs"       element={<JobsPage />} />
        <Route path="/jobs/:id"   element={<JobDetailPage />} />
        <Route path="/companies"  element={<CompaniesPage />} />
        <Route path="/dashboard"  element={<SmartRedirect />} />

        {/* ── Auth ───────────────────────────────────────────────────── */}
        <Route path="/login"                  element={<LoginPage />} />
        <Route path="/register"               element={<RegisterPage />} />
        <Route path="/forgot-password"        element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token"  element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token"    element={<VerifyEmailPage />} />

        {/* ── Jobseeker ──────────────────────────────────────────────── */}
        <Route path="/jobseeker" element={<ProtectedRoute roles={['jobseeker']}><JobseekerDashboard /></ProtectedRoute>} />
        <Route path="/jobseeker/jobs" element={<ProtectedRoute roles={['jobseeker']}><JobsPage /></ProtectedRoute>} />
        <Route path="/jobseeker/applications" element={<ProtectedRoute roles={['jobseeker']}><MyApplicationsPage /></ProtectedRoute>} />
        <Route path="/jobseeker/saved" element={<ProtectedRoute roles={['jobseeker']}><MyApplicationsPage /></ProtectedRoute>} />
        <Route path="/jobseeker/resume" element={<ProtectedRoute roles={['jobseeker']}><MyResumesPage /></ProtectedRoute>} />
        <Route path="/jobseeker/companies" element={<ProtectedRoute roles={['jobseeker']}><CompaniesPage /></ProtectedRoute>} />
        <Route path="/jobseeker/messages" element={<ProtectedRoute roles={['jobseeker']}><ChatPage role="jobseeker" /></ProtectedRoute>} />
        <Route path="/jobseeker/notifications" element={<ProtectedRoute roles={['jobseeker']}><NotificationsPage role="jobseeker" /></ProtectedRoute>} />
        <Route path="/jobseeker/packages" element={<ProtectedRoute roles={['jobseeker']}><PackagesPage role="jobseeker" /></ProtectedRoute>} />
        <Route path="/jobseeker/settings" element={<ProtectedRoute roles={['jobseeker']}><SettingsPage role="jobseeker" /></ProtectedRoute>} />

        {/* ── Employer ───────────────────────────────────────────────── */}
        <Route path="/employer" element={<ProtectedRoute roles={['employer']}><EmployerDashboard /></ProtectedRoute>} />
        <Route path="/employer/jobs" element={<ProtectedRoute roles={['employer']}><MyJobsPage /></ProtectedRoute>} />
        <Route path="/employer/jobs/new" element={<ProtectedRoute roles={['employer']}><PostJobPage /></ProtectedRoute>} />
        <Route path="/employer/jobs/:id/edit" element={<ProtectedRoute roles={['employer']}><PostJobPage /></ProtectedRoute>} />
        <Route path="/employer/applications" element={<ProtectedRoute roles={['employer']}><ApplicantsPage /></ProtectedRoute>} />
        <Route path="/employer/resumes" element={<ProtectedRoute roles={['employer']}><ResumeSearchPage /></ProtectedRoute>} />
        <Route path="/employer/company" element={<ProtectedRoute roles={['employer']}><CompanyProfilePage /></ProtectedRoute>} />
        <Route path="/employer/messages" element={<ProtectedRoute roles={['employer']}><ChatPage role="employer" /></ProtectedRoute>} />
        <Route path="/employer/notifications" element={<ProtectedRoute roles={['employer']}><NotificationsPage role="employer" /></ProtectedRoute>} />
        <Route path="/employer/packages" element={<ProtectedRoute roles={['employer']}><PackagesPage role="employer" /></ProtectedRoute>} />
        <Route path="/employer/analytics" element={<ProtectedRoute roles={['employer']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/employer/settings" element={<ProtectedRoute roles={['employer']}><SettingsPage role="employer" /></ProtectedRoute>} />

        {/* ── Admin ──────────────────────────────────────────────────── */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin', 'superadmin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin', 'superadmin']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/jobs" element={<ProtectedRoute roles={['admin', 'superadmin']}><AdminJobsPage /></ProtectedRoute>} />
        <Route path="/admin/companies" element={<ProtectedRoute roles={['admin', 'superadmin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin', 'superadmin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={['admin', 'superadmin']}><SettingsPage role="admin" /></ProtectedRoute>} />

        {/* ── 404 ────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppInitializer>
  </BrowserRouter>
)

// ── Inline Chat + Settings + Analytics pages ───────────────────────────────
import { ChatPage } from './pages/chat'
import { SettingsPage } from './pages/settings'
import { AnalyticsPage } from './pages/analytics'

const App = () => (
  <Provider store={store}>
    <AppRoutes />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          borderRadius: 10,
          boxShadow: 'var(--shadow-lg)',
        },
        success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
        error:   { iconTheme: { primary: 'var(--error)',   secondary: '#fff' } },
      }}
    />
  </Provider>
)

export default App
