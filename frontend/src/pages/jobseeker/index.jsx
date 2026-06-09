import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { applicationsAPI, resumesAPI, jobsAPI, packagesAPI, notificationsAPI } from '../../api'
import { selectUser, updateUser, setNotifications, markAllRead } from '../../store'
import { DashboardLayout } from '../../components/layout'
import { Button, Card, StatCard, EmptyState, Pagination, StatusBadge, Spinner, Modal, Input, Textarea, Avatar, ConfirmDialog } from '../../components/common'
import JobCard from '../../components/jobs/JobCard'
import toast from 'react-hot-toast'

// ══════════════════════════════════════════════════════════════
// JOBSEEKER DASHBOARD HOME
// ══════════════════════════════════════════════════════════════
export const JobseekerDashboard = () => {
  const user = useSelector(selectUser)
  const [stats, setStats] = useState({ applied: 0, shortlisted: 0, interviews: 0, hired: 0 })
  const [recentApps, setRecentApps] = useState([])
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      applicationsAPI.getMine({ limit: 5 }),
      jobsAPI.getShortlisted(),
    ]).then(([apps, saved]) => {
      const appData = apps.value?.data?.data || []
      setRecentApps(appData)
      setSavedJobs(saved.value?.data?.jobs?.slice(0, 3) || [])
      const s = { applied: 0, shortlisted: 0, interviews: 0, hired: 0 }
      appData.forEach(a => {
        if (a.status === 'applied' || a.status === 'reviewed') s.applied++
        if (a.status === 'shortlisted') s.shortlisted++
        if (a.status === 'interview_scheduled') s.interviews++
        if (a.status === 'hired') s.hired++
      })
      setStats(s)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout role="jobseeker" pageTitle="Dashboard">
      {/* Welcome */}
      <div style={{ background: 'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-800) 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180,
          borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 22, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
            Good day, {user?.firstName}! 👋
          </h2>
          <p style={{ opacity: .8, fontSize: 14 }}>Track your applications and discover new opportunities.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <Link to="/jobs" className="btn btn-sm" style={{ background: '#fff', color: 'var(--brand-700)', fontWeight: 700 }}>
              Find Jobs →
            </Link>
            <Link to="/jobseeker/resume" className="btn btn-sm" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }}>
              Update Resume
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Applied', value: recentApps.length, icon: '📋', color: 'var(--brand-600)' },
          { label: 'Shortlisted', value: stats.shortlisted, icon: '⭐', color: '#7c3aed' },
          { label: 'Interviews', value: stats.interviews, icon: '📅', color: '#d97706' },
          { label: 'Hired', value: stats.hired, icon: '🎉', color: 'var(--success)' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        {/* Recent Applications */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)' }}>Recent Applications</h3>
            <Link to="/jobseeker/applications" style={{ fontSize: 13, color: 'var(--brand-600)', fontWeight: 600 }}>View All</Link>
          </div>
          {loading ? <Spinner /> : recentApps.length === 0
            ? <EmptyState icon="📋" title="No applications yet" desc="Start applying to jobs to track them here"
                action={<Link to="/jobs" className="btn btn-primary btn-sm">Browse Jobs</Link>} />
            : recentApps.map(app => (
              <div key={app._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{app.jobId?.title || 'Job'}</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                    {app.jobId?.companyId?.name || ''} • {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))
          }
        </Card>

        {/* Saved Jobs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)' }}>Saved Jobs</h3>
              <Link to="/jobseeker/saved" style={{ fontSize: 13, color: 'var(--brand-600)', fontWeight: 600 }}>View All</Link>
            </div>
            {savedJobs.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--gray-400)', textAlign: 'center', padding: '20px 0' }}>No saved jobs yet</p>
              : savedJobs.map(job => (
                <Link key={job._id} to={`/jobs/${job.slug || job._id}`}
                  style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--gray-100)', textDecoration: 'none' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{job.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>{job.companyId?.name} • {job.city}</p>
                </Link>
              ))
            }
          </Card>

          <Card style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', border: '1px solid #ddd6fe' }}>
            <h4 style={{ fontSize: 14, fontFamily: 'var(--font-display)', marginBottom: 8 }}>💡 Profile Tip</h4>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
              Complete your profile to get 3x more recruiter views. Add your skills and work experience.
            </p>
            <Link to="/jobseeker/resume" className="btn btn-sm" style={{ marginTop: 12, background: '#7c3aed', color: '#fff', display: 'inline-flex' }}>
              Complete Profile
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// MY APPLICATIONS PAGE
// ══════════════════════════════════════════════════════════════
export const MyApplicationsPage = () => {
  const [apps, setApps] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [withdrawId, setWithdrawId] = useState(null)

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: 10 }
    if (statusFilter) params.status = statusFilter
    applicationsAPI.getMine(params)
      .then(res => { setApps(res.data.data || []); setTotal(res.data.pagination?.total || 0) })
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  const handleWithdraw = async () => {
    try {
      await applicationsAPI.withdraw(withdrawId, { reason: 'Withdrawing application' })
      setApps(prev => prev.map(a => a._id === withdrawId ? { ...a, status: 'withdrawn' } : a))
      toast.success('Application withdrawn')
    } catch {}
    setWithdrawId(null)
  }

  const statuses = ['applied', 'reviewed', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn']

  return (
    <DashboardLayout role="jobseeker" pageTitle="My Applications">
      <div className="page-header">
        <h1>My Applications</h1>
        <p>Track and manage all your job applications</p>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setStatusFilter('')} className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-ghost'}`}>
          All ({total})
        </button>
        {['shortlisted', 'interview_scheduled', 'hired'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}>
            {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
        : apps.length === 0 ? <EmptyState icon="📋" title="No applications found" />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {apps.map(app => (
              <motion.div key={app._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--brand-50)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      fontWeight: 700, color: 'var(--brand-600)', fontSize: 18,
                      border: '1px solid var(--gray-200)' }}>
                      {app.jobId?.companyId?.name?.[0] || 'C'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                            {app.jobId?.title || 'Job'}
                          </h3>
                          <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                            {app.jobId?.companyId?.name || '—'} • Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <StatusBadge status={app.status} />
                          {!['hired', 'rejected', 'withdrawn'].includes(app.status) && (
                            <button onClick={() => setWithdrawId(app._id)}
                              className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', fontSize: 12 }}>
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                      {app.interview?.scheduledAt && app.status === 'interview_scheduled' && (
                        <div style={{ marginTop: 10, background: '#faf5ff', padding: '10px 14px',
                          borderRadius: 8, border: '1px solid #ddd6fe', fontSize: 13 }}>
                          📅 Interview: <strong>{format(new Date(app.interview.scheduledAt), 'PPp')}</strong>
                          {app.interview.type && <> • {app.interview.type}</>}
                          {app.interview.link && <> • <a href={app.interview.link} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-600)' }}>Join</a></>}
                        </div>
                      )}
                      {app.employerNotes && (
                        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--gray-500)',
                          background: 'var(--gray-50)', padding: '8px 12px', borderRadius: 8 }}>
                          💬 {app.employerNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      }
      <Pagination page={page} total={total} limit={10} onChange={setPage} />

      <ConfirmDialog open={!!withdrawId} onClose={() => setWithdrawId(null)} onConfirm={handleWithdraw}
        title="Withdraw Application" message="Are you sure you want to withdraw this application? This cannot be undone."
        confirmLabel="Withdraw" danger />
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// MY RESUMES PAGE
// ══════════════════════════════════════════════════════════════
export const MyResumesPage = () => {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ applicationTitle: '', skills: '', resume: '', quickApply: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    resumesAPI.getMine().then(res => setResumes(res.data.resumes || [])).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await resumesAPI.create(form)
      setResumes(prev => [res.data.resume, ...prev])
      setShowCreate(false)
      setForm({ applicationTitle: '', skills: '', resume: '', quickApply: false })
      toast.success('Resume created!')
    } catch {}
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await resumesAPI.remove(id)
      setResumes(prev => prev.filter(r => r._id !== id))
      toast.success('Resume deleted')
    } catch {}
  }

  const handleUploadFile = async (resumeId, file) => {
    const form = new FormData()
    form.append('file', file)
    try {
      await resumesAPI.uploadFile(resumeId, form)
      toast.success('File uploaded!')
    } catch {}
  }

  return (
    <DashboardLayout role="jobseeker" pageTitle="My Resumes">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h1>My Resumes</h1>
          <p>Manage your resumes and portfolios</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Resume</Button>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
        : resumes.length === 0 ? (
          <EmptyState icon="📄" title="No resumes yet"
            desc="Create your first resume to start applying"
            action={<Button onClick={() => setShowCreate(true)}>Create Resume</Button>} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {resumes.map(resume => (
              <Card key={resume._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--brand-50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {resume.quickApply && <span className="badge badge-green" style={{ fontSize: 11 }}>Quick Apply</span>}
                    <span className={`badge ${resume.published ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                      {resume.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 6 }}>{resume.applicationTitle}</h3>
                {resume.skills && (
                  <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12, lineHeight: 1.5 }}>
                    {resume.skills.slice(0, 80)}...
                  </p>
                )}
                <p style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 16 }}>
                  Updated {formatDistanceToNow(new Date(resume.updatedAt || resume.createdAt), { addSuffix: true })}
                </p>
                {resume.files?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {resume.files.map(f => (
                      <a key={f._id} href={f.secureUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: 'var(--brand-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        📎 {f.filename}
                      </a>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/jobseeker/resume/${resume._id}/edit`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    Edit
                  </Link>
                  <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                    📎
                    <input type="file" accept=".pdf,.doc,.docx" hidden
                      onChange={e => e.target.files[0] && handleUploadFile(resume._id, e.target.files[0])} />
                  </label>
                  <button onClick={() => handleDelete(resume._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                    🗑
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )
      }

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Resume">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Professional Title *" value={form.applicationTitle}
            onChange={e => setForm(f => ({ ...f, applicationTitle: e.target.value }))}
            placeholder="e.g. Senior React Developer" required />
          <Textarea label="Skills" value={form.skills}
            onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
            placeholder="React, Node.js, MongoDB..." rows={3} />
          <Textarea label="Summary / Bio" value={form.resume}
            onChange={e => setForm(f => ({ ...f, resume: e.target.value }))}
            placeholder="Brief professional summary..." rows={4} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Resume</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS PAGE
// ══════════════════════════════════════════════════════════════
export const NotificationsPage = ({ role = 'jobseeker' }) => {
  const dispatch = useDispatch()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    notificationsAPI.getAll({ limit: 50 }).then(res => {
      const data = res.data.notifications || []
      setNotifs(data)
      dispatch(setNotifications({ notifications: data, unreadCount: res.data.unreadCount || 0 }))
    }).finally(() => setLoading(false))
  }, [])

  const handleMarkAllRead = async () => {
    await notificationsAPI.markRead({ ids: 'all' })
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    dispatch(markAllRead())
  }

  const typeIcon = (type) => {
    const icons = {
      application_received: '📬',
      shortlisted: '⭐',
      interview_scheduled: '📅',
      hired: '🎉',
      rejected: '❌',
      job_approved: '✅',
      message_received: '💬',
      package_expiry: '⚠️',
      payment_success: '💳',
    }
    return icons[type] || '🔔'
  }

  return (
    <DashboardLayout role={role} pageTitle="Notifications">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Notifications</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>Mark All Read</Button>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
        : notifs.length === 0 ? <EmptyState icon="🔔" title="No notifications" desc="You're all caught up!" />
        : (
          <Card>
            {notifs.map((n, i) => (
              <motion.div key={n._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * .02 }}>
                <div style={{ display: 'flex', gap: 14, padding: '14px 0',
                  borderBottom: i < notifs.length - 1 ? '1px solid var(--gray-100)' : 'none',
                  background: !n.isRead ? 'transparent' : 'transparent' }}>
                  <div style={{ fontSize: 24, flexShrink: 0, width: 44, height: 44,
                    background: n.isRead ? 'var(--gray-50)' : 'var(--brand-50)',
                    borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {typeIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: n.isRead ? 400 : 700, color: 'var(--gray-800)', marginBottom: 3 }}>
                      {n.title}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5 }}>{n.message}</p>
                    <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-500)', flexShrink: 0, marginTop: 6 }} />
                  )}
                </div>
              </motion.div>
            ))}
          </Card>
        )
      }
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// PACKAGES PAGE
// ══════════════════════════════════════════════════════════════
export const PackagesPage = ({ role = 'jobseeker' }) => {
  const [packages, setPackages] = useState([])
  const [myPkg, setMyPkg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(null)

  useEffect(() => {
    Promise.allSettled([
      packagesAPI.getAll(),
      packagesAPI.getMine(),
    ]).then(([all, mine]) => {
      const allPkgs = all.value?.data?.packages || []
      setPackages(allPkgs.filter(p => p.packageFor === role || p.packageFor === 'both'))
      const active = mine.value?.data?.packages?.find(p => p.status && new Date(p.endDate) > new Date())
      setMyPkg(active)
    }).finally(() => setLoading(false))
  }, [role])

  const handleBuy = async (pkg) => {
    if (typeof window.Razorpay === 'undefined') {
      toast.error('Payment gateway not loaded. Please refresh.')
      return
    }
    setBuying(pkg._id)
    try {
      const res = await packagesAPI.razorpayOrder({ packageId: pkg._id })
      const { orderId, amount, currency, invoiceId, key } = res.data

      const options = {
        key, amount, currency,
        name: 'JobPortal',
        description: pkg.title,
        order_id: orderId,
        handler: async (response) => {
          try {
            await packagesAPI.razorpayVerify({ ...response, invoiceId })
            toast.success('Package activated! 🎉')
            window.location.reload()
          } catch {}
        },
        prefill: {},
        theme: { color: '#0a7ef0' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {}
    finally { setBuying(null) }
  }

  const planColors = ['var(--gray-600)', 'var(--brand-600)', '#7c3aed', '#d97706']

  return (
    <DashboardLayout role={role} pageTitle="Packages">
      <div className="page-header">
        <h1>Subscription Plans</h1>
        <p>Choose the right plan to unlock more features</p>
      </div>

      {myPkg && (
        <Card style={{ marginBottom: 28, background: 'linear-gradient(135deg, var(--brand-50), #fff)', border: '1px solid var(--brand-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, color: 'var(--brand-600)', fontWeight: 700, marginBottom: 4 }}>✅ Active Package</p>
              <h3 style={{ fontFamily: 'var(--font-display)' }}>{myPkg.packageId?.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
                Expires {format(new Date(myPkg.endDate), 'PPP')}
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13 }}>
              <p style={{ color: 'var(--gray-600)' }}>Jobs: <strong>{myPkg.remainingJobs === 999999 ? '∞' : myPkg.remainingJobs}</strong></p>
              <p style={{ color: 'var(--gray-600)' }}>Apply: <strong>{myPkg.remainingJobApply}</strong></p>
            </div>
          </div>
        </Card>
      )}

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {packages.map((pkg, i) => {
              const color = planColors[i % planColors.length]
              const isCurrent = myPkg?.packageId?._id === pkg._id
              return (
                <motion.div key={pkg._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}>
                  <Card style={{ borderTop: `3px solid ${color}`, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {isCurrent && (
                      <div style={{ position: 'absolute', top: -1, right: 16, background: color, color: '#fff',
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: '0 0 8px 8px' }}>
                        CURRENT
                      </div>
                    )}
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 8 }}>{pkg.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        {pkg.isFree ? (
                          <span style={{ fontSize: 28, fontWeight: 800, color }}>Free</span>
                        ) : (
                          <>
                            <span style={{ fontSize: 28, fontWeight: 800, color }}>₹{pkg.price}</span>
                            <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>/{pkg.packageTime} {pkg.packageTimeUnit}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, listStyle: 'none' }}>
                      {[
                        pkg.job > 0 && `${pkg.job === -1 ? 'Unlimited' : pkg.job} Job Posts`,
                        pkg.jobApply > 0 && `${pkg.jobApply} Job Applications`,
                        pkg.resume > 0 && `${pkg.resume} Resumes`,
                        pkg.jobAlert > 0 && `${pkg.jobAlert} Job Alerts`,
                        pkg.featuredJob > 0 && `${pkg.featuredJob} Featured Jobs`,
                        pkg.resumeSearch > 0 && `${pkg.resumeSearch === -1 ? 'Unlimited' : pkg.resumeSearch} Resume Searches`,
                      ].filter(Boolean).map(feat => (
                        <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-700)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <Button
                      style={{ width: '100%', background: isCurrent ? 'var(--gray-200)' : color, color: isCurrent ? 'var(--gray-500)' : '#fff' }}
                      disabled={isCurrent || pkg.isFree}
                      loading={buying === pkg._id}
                      onClick={() => !pkg.isFree && !isCurrent && handleBuy(pkg)}>
                      {isCurrent ? 'Current Plan' : pkg.isFree ? 'Free Forever' : 'Get Started'}
                    </Button>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )
      }
    </DashboardLayout>
  )
}
