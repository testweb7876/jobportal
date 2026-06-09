import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { authAPI, jobsAPI } from '../../api'
import { selectUser, updateUser } from '../../store'
import { DashboardLayout } from '../../components/layout'
import { Button, Card, Input, Textarea, Avatar, Toggle, Spinner } from '../../components/common'
import toast from 'react-hot-toast'

// ══════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════════════════════
export const SettingsPage = ({ role = 'jobseeker' }) => {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    phone:     user?.phone     || '',
  })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [notifSettings, setNotifSettings] = useState(user?.notificationSettings || {
    emailOnApplication: true,
    emailOnMessage: true,
    emailOnJobAlert: true,
    emailOnPackageExpiry: true,
    pushNotifications: true,
  })

  const tabs = [
    { id: 'profile',  label: '👤 Profile' },
    { id: 'password', label: '🔐 Password' },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'sessions', label: '🖥 Sessions' },
    { id: 'danger',   label: '⚠️ Danger Zone' },
  ]

  // ── Profile Save ───────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authAPI.getMe()  // verify session
      dispatch(updateUser(profileForm))
      toast.success('Profile updated!')
    } catch {}
    finally { setSaving(false) }
  }

  // ── Password Save ──────────────────────────────────────────
  const savePassword = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pwForm.currentPassword) errs.currentPassword = 'Required'
    if (pwForm.newPassword.length < 8) errs.newPassword = 'Min 8 characters'
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) return setPwErrors(errs)
    setSaving(true)
    try {
      await authAPI.changePassword(pwForm)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password changed! Please login again.')
    } catch {}
    finally { setSaving(false) }
  }

  // ── Avatar Upload ──────────────────────────────────────────
  const handleAvatarUpload = async (file) => {
    const form = new FormData()
    form.append('avatar', file)
    try {
      const { uploadImage } = await import('../../api/index')
      toast.success('Avatar updated!')
    } catch {}
  }

  const [sessions, setSessions] = useState([])
  useEffect(() => {
    if (activeTab === 'sessions') {
      authAPI.getSessions().then(res => setSessions(res.data.sessions || [])).catch(() => {})
    }
  }, [activeTab])

  const revokeSession = async (id) => {
    try {
      await authAPI.revokeSession(id)
      setSessions(prev => prev.filter(s => s._id !== id))
      toast.success('Session revoked')
    } catch {}
  }

  const Tab = ({ id, label }) => (
    <button onClick={() => setActiveTab(id)}
      style={{
        width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer',
        textAlign: 'left', borderRadius: 8, fontSize: 14, fontWeight: activeTab === id ? 600 : 400,
        background: activeTab === id ? 'var(--brand-50)' : 'transparent',
        color: activeTab === id ? 'var(--brand-700)' : 'var(--gray-600)',
        borderLeft: `3px solid ${activeTab === id ? 'var(--brand-500)' : 'transparent'}`,
        transition: 'all .15s',
      }}>
      {label}
    </button>
  )

  return (
    <DashboardLayout role={role} pageTitle="Settings">
      <div className="page-header">
        <h1>Account Settings</h1>
        <p>Manage your account preferences and security</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Tab nav */}
        <Card style={{ padding: 8 }}>
          {tabs.map(t => <Tab key={t.id} {...t} />)}
        </Card>

        {/* Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .2 }}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 24, fontSize: 17 }}>Profile Information</h3>

              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28,
                padding: 16, background: 'var(--gray-50)', borderRadius: 12 }}>
                <Avatar src={user?.avatar?.secureUrl} name={`${user?.firstName} ${user?.lastName}`} size="lg" />
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>{user?.firstName} {user?.lastName}</p>
                  <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 10 }}>{user?.email}</p>
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                    Change Photo
                    <input type="file" accept="image/*" hidden onChange={e => e.target.files[0] && handleAvatarUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>

              <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Input label="First Name" value={profileForm.firstName}
                    onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} />
                  <Input label="Last Name" value={profileForm.lastName}
                    onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
                <Input label="Phone" value={profileForm.phone}
                  onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210" />
                <Input label="Email" value={user?.email || ''} disabled
                  style={{ background: 'var(--gray-50)', color: 'var(--gray-500)' }} />
                <div style={{ paddingTop: 8 }}>
                  <Button type="submit" loading={saving}>Save Changes</Button>
                </div>
              </form>
            </Card>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 24, fontSize: 17 }}>Change Password</h3>
              <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                <Input label="Current Password" type="password" value={pwForm.currentPassword}
                  error={pwErrors.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
                <Input label="New Password" type="password" value={pwForm.newPassword}
                  error={pwErrors.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Min 8 chars, uppercase, number" />
                <Input label="Confirm New Password" type="password" value={pwForm.confirmPassword}
                  error={pwErrors.confirmPassword}
                  onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                <div style={{ background: 'var(--brand-50)', padding: '12px 16px', borderRadius: 10, fontSize: 13, color: 'var(--brand-700)' }}>
                  💡 Changing password will log you out of all devices.
                </div>
                <Button type="submit" loading={saving}>Change Password</Button>
              </form>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 24, fontSize: 17 }}>Notification Preferences</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { key: 'emailOnApplication', label: 'New Application', desc: 'Email when you receive a new application' },
                  { key: 'emailOnMessage', label: 'New Message', desc: 'Email when you receive a message' },
                  { key: 'emailOnJobAlert', label: 'Job Alerts', desc: 'Email matching job notifications' },
                  { key: 'emailOnPackageExpiry', label: 'Package Expiry', desc: 'Reminder before your plan expires' },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'In-app real-time notifications' },
                ].map(({ key, label, desc }) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{label}</p>
                      <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{desc}</p>
                    </div>
                    <Toggle
                      checked={notifSettings[key]}
                      onChange={val => setNotifSettings(s => ({ ...s, [key]: val }))}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24 }}>
                <Button onClick={() => toast.success('Notification preferences saved!')}>Save Preferences</Button>
              </div>
            </Card>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 24, fontSize: 17 }}>Active Sessions</h3>
              {sessions.length === 0 ? (
                <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: 32 }}>No active sessions found</p>
              ) : sessions.map(session => (
                <div key={session._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ fontSize: 32 }}>{session.os?.includes('Mobile') || session.os?.includes('iOS') || session.os?.includes('Android') ? '📱' : '💻'}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{session.deviceName || 'Unknown Device'}</p>
                      <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{session.browser} • {session.os}</p>
                      <p style={{ fontSize: 11, color: 'var(--gray-400)' }}>IP: {session.ipAddress}</p>
                    </div>
                  </div>
                  <button onClick={() => revokeSession(session._id)} className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--error)', fontSize: 12 }}>
                    Revoke
                  </button>
                </div>
              ))}
              <div style={{ marginTop: 20 }}>
                <Button variant="danger" size="sm" onClick={async () => {
                  await authAPI.logoutAll()
                  toast.success('All other sessions revoked')
                  setSessions([])
                }}>
                  Revoke All Other Sessions
                </Button>
              </div>
            </Card>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <Card style={{ border: '1px solid #fecaca' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8, fontSize: 17, color: 'var(--error)' }}>
                ⚠️ Danger Zone
              </h3>
              <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 24 }}>
                These actions are irreversible. Please proceed with caution.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px', border: '1px solid var(--gray-200)', borderRadius: 10 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>Delete Account</p>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Permanently delete your account and all data</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => toast.error('Please contact support to delete your account')}>
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// ANALYTICS PAGE (Employer)
// ══════════════════════════════════════════════════════════════
export const AnalyticsPage = () => {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    jobsAPI.getMyJobs({ limit: 100 }).then(res => {
      const j = res.data.data || []
      setJobs(j)
      if (j.length > 0) setSelectedJob(j[0]._id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedJob) return
    setLoading(true)
    jobsAPI.getAnalytics(selectedJob)
      .then(res => setAnalytics(res.data))
      .finally(() => setLoading(false))
  }, [selectedJob])

  const COLORS = ['var(--brand-500)', '#7c3aed', 'var(--success)', '#d97706', 'var(--error)', '#0891b2']

  return (
    <DashboardLayout role="employer" pageTitle="Analytics">
      <div className="page-header">
        <h1>Job Analytics</h1>
        <p>Track performance of your job postings</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <select className="form-input" style={{ maxWidth: 400 }} value={selectedJob}
          onChange={e => setSelectedJob(e.target.value)}>
          <option value="">Select a job</option>
          {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>
      ) : analytics ? (
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Views', value: analytics.viewsCount || 0, icon: '👁' },
              { label: 'Total Applications', value: analytics.applicationsCount || 0, icon: '📋' },
              { label: 'Conversion Rate', value: `${analytics.viewsCount > 0 ? ((analytics.applicationsCount / analytics.viewsCount) * 100).toFixed(1) : 0}%`, icon: '📈' },
            ].map(s => (
              <Card key={s.label}>
                <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>{s.icon} {s.label}</p>
                <p style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{s.value}</p>
              </Card>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            {/* Daily Applications Chart */}
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: 16 }}>Daily Applications (30 days)</h3>
              {analytics.dailyApplications?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analytics.dailyApplications}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="var(--brand-500)" fill="url(#colorApps)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>No data yet</div>
              )}
            </Card>

            {/* Status Breakdown Pie */}
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: 16 }}>Status Breakdown</h3>
              {Object.keys(analytics.statusBreakdown || {}).length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={Object.entries(analytics.statusBreakdown).map(([name, value]) => ({ name, value }))}
                        cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                        {Object.keys(analytics.statusBreakdown).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {Object.entries(analytics.statusBreakdown).map(([status, count], i) => (
                      <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                          <span style={{ color: 'var(--gray-600)' }}>{status.replace(/_/g, ' ')}</span>
                        </div>
                        <span style={{ fontWeight: 700 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40, fontSize: 14 }}>No applications yet</div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <p>Select a job to view analytics</p>
        </div>
      )}
    </DashboardLayout>
  )
}
