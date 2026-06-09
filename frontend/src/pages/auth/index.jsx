import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { loginUser, registerUser, selectAuthLoading, selectUser } from '../../store'
import { authAPI } from '../../api'
import { Button, Input } from '../../components/common'
import toast from 'react-hot-toast'

// ── Shared Auth Layout ─────────────────────────────────────────────────────
const AuthLayout = ({ children, title, subtitle }) => (
  <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
    {/* Left Panel */}
    <div style={{
      background: 'linear-gradient(135deg, var(--gray-900) 0%, var(--brand-900) 100%)',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '60px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'var(--brand-500)', opacity: .07 }} />
      <div style={{ position: 'absolute', bottom: -80, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'var(--brand-300)', opacity: .05 }} />

      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        </div>
        <span style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
          Job<span style={{ color: 'var(--brand-300)' }}>Portal</span>
        </span>
      </Link>

      <h1 style={{ fontSize: 38, fontFamily: 'var(--font-display)', color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
        Your Next Career Move Starts Here
      </h1>
      <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 16, lineHeight: 1.7, maxWidth: 380 }}>
        Connect with 50,000+ job opportunities and 10,000+ companies. Build your dream career with JobPortal.
      </p>

      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {['50,000+ Active Jobs', '10,000+ Verified Companies', '200,000+ Candidates'].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 14 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Right Panel */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: '#fff' }}>
      <motion.div style={{ width: '100%', maxWidth: 420 }}
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .4 }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontFamily: 'var(--font-display)', marginBottom: 8 }}>{title}</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 15 }}>{subtitle}</p>
        </div>
        {children}
      </motion.div>
    </div>
  </div>
)

// ══════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════
export const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loading = useSelector(selectAuthLoading)
  const user = useSelector(selectUser)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      const map = { jobseeker: '/jobseeker', employer: '/employer', admin: '/admin' }
      navigate(map[user.role] || '/')
    }
  }, [user])

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email required'
    if (!form.password) e.password = 'Password required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = await dispatch(loginUser(form))
    if (loginUser.fulfilled.match(result)) {
      const role = result.payload.user.role
      navigate(role === 'employer' ? '/employer' : role === 'admin' ? '/admin' : '/jobseeker')
    } else {
      toast.error(result.payload || 'Login failed')
    }
  }

  return (
    <AuthLayout title="Welcome Back 👋" subtitle="Login to your account to continue">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input label="Email Address" type="email" value={form.email} error={errors.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="you@email.com" />
        <div>
          <Input label="Password" type="password" value={form.password} error={errors.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Your password" />
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--brand-600)', fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" loading={loading} style={{ width: '100%', padding: '13px', fontSize: 15 }}>
          Sign In
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--gray-500)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--brand-600)', fontWeight: 600 }}>Create one</Link>
      </div>
    </AuthLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// REGISTER PAGE
// ══════════════════════════════════════════════════════════════
export const RegisterPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loading = useSelector(selectAuthLoading)
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    role: searchParams.get('role') || 'jobseeker',
    phone: '',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name required'
    if (!form.lastName.trim()) e.lastName = 'Last name required'
    if (!form.email) e.email = 'Email required'
    if (form.password.length < 8) e.password = 'At least 8 characters'
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Must include uppercase, lowercase, number'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const { confirmPassword, ...data } = form
    const result = await dispatch(registerUser(data))
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Please check your email to verify.')
      const role = result.payload.user.role
      navigate(role === 'employer' ? '/employer' : '/jobseeker')
    }
  }

  const RoleBtn = ({ value, label, icon, desc }) => (
    <button type="button"
      onClick={() => setForm(f => ({ ...f, role: value }))}
      style={{
        flex: 1, padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
        border: `2px solid ${form.role === value ? 'var(--brand-500)' : 'var(--gray-200)'}`,
        background: form.role === value ? 'var(--brand-50)' : '#fff',
        transition: 'all .15s',
      }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: form.role === value ? 'var(--brand-700)' : 'var(--gray-700)' }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{desc}</div>
    </button>
  )

  return (
    <AuthLayout title="Create Account 🚀" subtitle="Join thousands of professionals on JobPortal">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Role Select */}
        <div>
          <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>I am a...</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <RoleBtn value="jobseeker" label="Job Seeker" icon="👤" desc="Find your next job" />
            <RoleBtn value="employer"  label="Employer"   icon="🏢" desc="Hire top talent" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="First Name" value={form.firstName} error={errors.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John" />
          <Input label="Last Name" value={form.lastName} error={errors.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Doe" />
        </div>

        <Input label="Email Address" type="email" value={form.email} error={errors.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" />

        <Input label="Phone (Optional)" type="tel" value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />

        <Input label="Password" type="password" value={form.password} error={errors.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 chars, uppercase, number" />

        <Input label="Confirm Password" type="password" value={form.confirmPassword} error={errors.confirmPassword}
          onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat password" />

        <Button type="submit" loading={loading} style={{ width: '100%', padding: '13px', fontSize: 15 }}>
          Create Account
        </Button>
      </form>

      <p style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: 16 }}>
        By registering you agree to our Terms of Service and Privacy Policy
      </p>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--gray-500)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--brand-600)', fontWeight: 600 }}>Sign in</Link>
      </div>
    </AuthLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ══════════════════════════════════════════════════════════════
export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await authAPI.forgotPassword({ email })
      setSent(true)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <AuthLayout title="Reset Password 🔐" subtitle="Enter your email and we'll send a reset link">
      {sent ? (
        <motion.div style={{ textAlign: 'center', padding: '32px 0' }} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
          <h3 style={{ marginBottom: 10 }}>Check Your Email</h3>
          <p style={{ color: 'var(--gray-500)', marginBottom: 24, lineHeight: 1.6 }}>
            If an account with <strong>{email}</strong> exists, we've sent a password reset link.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>Back to Login</Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input label="Email Address" type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
          <Button type="submit" loading={loading} style={{ width: '100%', padding: '13px' }}>
            Send Reset Link
          </Button>
          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: 14, color: 'var(--gray-500)' }}>← Back to Login</Link>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// RESET PASSWORD
// ══════════════════════════════════════════════════════════════
export const ResetPasswordPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    setLoading(true)
    try {
      await authAPI.resetPassword(token, { password: form.password, confirmPassword: form.confirmPassword })
      toast.success('Password reset successful! Please login.')
      navigate('/login')
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <AuthLayout title="New Password 🔑" subtitle="Set a strong new password for your account">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input label="New Password" type="password" value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder="Min 8 chars, uppercase, number" />
        <Input label="Confirm Password" type="password" value={form.confirmPassword}
          onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
          placeholder="Repeat password" />
        {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}
        <Button type="submit" loading={loading} style={{ width: '100%', padding: '13px' }}>
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// VERIFY EMAIL
// ══════════════════════════════════════════════════════════════
export const VerifyEmailPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    authAPI.verifyEmail(token)
      .then(() => { setStatus('success'); setTimeout(() => navigate('/login'), 2500) })
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
      <motion.div className="card" style={{ textAlign: 'center', padding: '56px 48px', maxWidth: 420 }}
        initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        {status === 'loading' && (<><div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div><h2>Verifying...</h2></>)}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ marginBottom: 10 }}>Email Verified!</h2>
            <p style={{ color: 'var(--gray-500)' }}>Redirecting to login...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
            <h2 style={{ marginBottom: 10 }}>Invalid Link</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>This link is invalid or has expired.</p>
            <Link to="/login" className="btn btn-primary">Go to Login</Link>
          </>
        )}
      </motion.div>
    </div>
  )
}
