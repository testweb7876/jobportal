import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { adminAPI, jobsAPI } from '../../api'
import { DashboardLayout } from '../../components/layout'
import { Button, Card, StatCard, EmptyState, Pagination, StatusBadge, Spinner, Modal, Select, ConfirmDialog } from '../../components/common'
import { usePagination } from '../../hooks'
import toast from 'react-hot-toast'

// ══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════
export const AdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getStats().then(res => setData(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout role="admin" pageTitle="Dashboard"><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div></DashboardLayout>

  const { stats, monthlySignups = [], recentUsers = [], recentJobs = [] } = data || {}

  const chartData = monthlySignups.map(m => ({
    name: `${m._id.m}/${String(m._id.y).slice(2)}`,
    users: m.count,
  }))

  return (
    <DashboardLayout role="admin" pageTitle="Admin Dashboard">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Users', value: stats?.users?.total?.toLocaleString(), icon: '👥', color: 'var(--brand-600)' },
          { label: 'Employers', value: stats?.users?.employers, icon: '🏢', color: '#7c3aed' },
          { label: 'Active Jobs', value: stats?.jobs?.active?.toLocaleString(), icon: '💼', color: 'var(--success)' },
          { label: 'Pending Jobs', value: stats?.jobs?.pending, icon: '⏳', color: '#d97706' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Applications', value: stats?.applications?.toLocaleString(), icon: '📋', color: 'var(--brand-600)' },
          { label: 'Companies', value: stats?.companies?.total, icon: '🏭', color: '#0891b2' },
          { label: 'Revenue', value: `₹${(stats?.revenue || 0).toLocaleString()}`, icon: '💰', color: 'var(--success)' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 + .3 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: 16 }}>User Signups (Last 6 Months)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="var(--brand-500)" fill="url(#colorUsers)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>No data yet</p>}
        </Card>

        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: 16 }}>Quick Stats</h3>
          {[
            { label: 'Job Seekers', val: stats?.users?.jobseekers, total: stats?.users?.total },
            { label: 'Employers', val: stats?.users?.employers, total: stats?.users?.total },
            { label: 'Verified Companies', val: stats?.companies?.verified, total: stats?.companies?.total },
          ].map(({ label, val, total }) => {
            const pct = total ? Math.round((val / total) * 100) : 0
            return (
              <div key={label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--gray-600)' }}>{label}</span>
                  <span style={{ fontWeight: 700 }}>{val?.toLocaleString()} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand-500)', borderRadius: 99, transition: 'width 1s' }} />
                </div>
              </div>
            )
          })}
        </Card>
      </div>

      {/* Recent tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)' }}>Recent Users</h3>
            <Link to="/admin/users" style={{ fontSize: 13, color: 'var(--brand-600)', fontWeight: 600 }}>View All</Link>
          </div>
          {recentUsers.map(u => (
            <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{u.firstName} {u.lastName}</p>
                <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>{u.email}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${u.role === 'employer' ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: 11 }}>{u.role}</span>
                <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)' }}>Recent Jobs</h3>
            <Link to="/admin/jobs" style={{ fontSize: 13, color: 'var(--brand-600)', fontWeight: 600 }}>View All</Link>
          </div>
          {recentJobs.map(j => (
            <div key={j._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{j.title}</p>
                <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>{j.companyId?.name}</p>
              </div>
              <StatusBadge status={j.status} />
            </div>
          ))}
        </Card>
      </div>
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// ADMIN USERS PAGE
// ══════════════════════════════════════════════════════════════
export const AdminUsersPage = () => {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { page, limit, goTo } = usePagination(1, 20)
  const [editUser, setEditUser] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    adminAPI.getUsers({ search, role: roleFilter, status: statusFilter, page, limit })
      .then(res => { setUsers(res.data.data || []); setTotal(res.data.pagination?.total || 0) })
      .finally(() => setLoading(false))
  }, [search, roleFilter, statusFilter, page, limit])

  const handleUpdate = async (id, updates) => {
    setSaving(true)
    try {
      await adminAPI.updateUser(id, updates)
      setUsers(prev => prev.map(u => u._id === id ? { ...u, ...updates } : u))
      setEditUser(null)
      toast.success('User updated!')
    } catch {}
    finally { setSaving(false) }
  }

  return (
    <DashboardLayout role="admin" pageTitle="Users">
      <div className="page-header">
        <h1>Manage Users</h1>
        <p>{total.toLocaleString()} registered users</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'end' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="form-input" style={{ paddingLeft: 38 }} value={search}
              onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." />
          </div>
          <select className="form-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All Roles</option>
            <option value="jobseeker">Job Seeker</option>
            <option value="employer">Employer</option>
            <option value="admin">Admin</option>
          </select>
          <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </Card>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
        : (
          <div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>{u.firstName} {u.lastName}</p>
                          <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>{u.email}</p>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'employer' ? 'badge-purple' : u.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td><StatusBadge status={u.status} /></td>
                      <td style={{ fontSize: 18 }}>{u.isEmailVerified ? '✅' : '❌'}</td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setEditUser(u)} className="btn btn-ghost btn-sm">Edit</button>
                          <button onClick={() => handleUpdate(u._id, { status: u.status === 'active' ? 'suspended' : 'active' })}
                            className="btn btn-ghost btn-sm" style={{ color: u.status === 'active' ? 'var(--error)' : 'var(--success)' }}>
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={limit} onChange={goTo} />
          </div>
        )
      }

      {/* Edit User Modal */}
      {editUser && (
        <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User" size="sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 10 }}>
              <p style={{ fontWeight: 700 }}>{editUser.firstName} {editUser.lastName}</p>
              <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{editUser.email}</p>
            </div>
            <Select label="Role" defaultValue={editUser.role}
              onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}>
              <option value="jobseeker">Job Seeker</option>
              <option value="employer">Employer</option>
              <option value="admin">Admin</option>
            </Select>
            <Select label="Status" defaultValue={editUser.status}
              onChange={e => setEditUser(u => ({ ...u, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </Select>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button loading={saving} onClick={() => handleUpdate(editUser._id, { role: editUser.role, status: editUser.status })}>
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// ADMIN JOBS PAGE
// ══════════════════════════════════════════════════════════════
export const AdminJobsPage = () => {
  const [jobs, setJobs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const { page, limit, goTo } = usePagination(1, 20)
  const [moderating, setModerating] = useState(null)
  const [modForm, setModForm] = useState({ status: '', note: '' })

  useEffect(() => {
    setLoading(true)
    adminAPI.getJobs({ status: statusFilter, search, page, limit })
      .then(res => { setJobs(res.data.data || []); setTotal(res.data.pagination?.total || 0) })
      .finally(() => setLoading(false))
  }, [statusFilter, search, page, limit])

  const handleModerate = async () => {
    if (!modForm.status) return
    try {
      await jobsAPI.moderate(moderating._id, modForm)
      setJobs(prev => prev.map(j => j._id === moderating._id ? { ...j, status: modForm.status } : j))
      toast.success(`Job ${modForm.status}!`)
      setModerating(null)
    } catch {}
  }

  // const { jobsAPI } = require('../../api')

  return (
    <DashboardLayout role="admin" pageTitle="Manage Jobs">
      <div className="page-header">
        <h1>Manage Jobs</h1>
        <p>Review and moderate job postings</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..." />
          <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </Card>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
        : jobs.length === 0 ? <EmptyState icon="💼" title="No jobs found" />
        : (
          <div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Company</th>
                    <th>Posted</th>
                    <th>Applications</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job._id}>
                      <td>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>{job.title}</p>
                          <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>{job.city} • {job.workplaceType}</p>
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{job.companyId?.name || '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{job.applicationsCount || 0}</td>
                      <td><StatusBadge status={job.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/jobs/${job.slug || job._id}`} target="_blank" className="btn btn-ghost btn-sm">View</Link>
                          {job.status === 'pending' && (
                            <>
                              <button onClick={async () => { await jobsAPI.moderate(job._id, { status: 'approved' }); setJobs(prev => prev.filter(j => j._id !== job._id)); toast.success('Approved!') }}
                                className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff' }}>✓ Approve</button>
                              <button onClick={() => setModerating(job)}
                                className="btn btn-sm" style={{ background: 'var(--error)', color: '#fff' }}>✗ Reject</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={limit} onChange={goTo} />
          </div>
        )
      }

      <Modal open={!!moderating} onClose={() => setModerating(null)} title="Reject Job" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>{moderating?.title}</p>
          <Select label="Action" value={modForm.status} onChange={e => setModForm(f => ({ ...f, status: e.target.value }))}>
            <option value="">Select</option>
            <option value="rejected">Reject</option>
            <option value="paused">Pause</option>
          </Select>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-input" rows={3} value={modForm.note}
              onChange={e => setModForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Explain why this job is being rejected..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModerating(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleModerate}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
