import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import { jobsAPI, applicationsAPI, companiesAPI, resumesAPI } from '../../api'
import { selectUser } from '../../store'
import { DashboardLayout } from '../../components/layout'
import { Button, Card, StatCard, EmptyState, Pagination, StatusBadge, Spinner, Modal, Input, Textarea, Select, ConfirmDialog, Avatar } from '../../components/common'
import { useLookup, usePagination } from '../../hooks'
import toast from 'react-hot-toast'

// ══════════════════════════════════════════════════════════════
// EMPLOYER DASHBOARD HOME
// ══════════════════════════════════════════════════════════════
export const EmployerDashboard = () => {
  const user = useSelector(selectUser)
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, unreadApplications: 0 })
  const [recentApps, setRecentApps] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      applicationsAPI.getStats(),
      jobsAPI.getMyJobs({ limit: 5 }),
    ]).then(([statsRes, jobsRes]) => {
      if (statsRes.value) setStats(statsRes.value.data)
      if (jobsRes.value) setMyJobs(jobsRes.value.data.data || [])
    }).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout role="employer" pageTitle="Dashboard">
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 22, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
            Welcome, {user?.firstName}! 🏢
          </h2>
          <p style={{ opacity: .75, fontSize: 14 }}>Manage your job postings and find the best talent.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <Link to="/employer/jobs/new" className="btn btn-sm" style={{ background: '#fff', color: '#312e81', fontWeight: 700 }}>
              + Post New Job
            </Link>
            <Link to="/employer/resumes" className="btn btn-sm" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }}>
              Search Resumes
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Jobs', value: stats.totalJobs, icon: '💼', color: '#7c3aed' },
          { label: 'Total Applications', value: stats.totalApplications, icon: '📋', color: 'var(--brand-600)' },
          { label: 'Unread Applications', value: stats.unreadApplications, icon: '🔔', color: '#d97706' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* My Jobs */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)' }}>My Job Postings</h3>
            <Link to="/employer/jobs" style={{ fontSize: 13, color: 'var(--brand-600)', fontWeight: 600 }}>View All</Link>
          </div>
          {loading ? <Spinner /> : myJobs.length === 0
            ? <EmptyState icon="💼" title="No jobs posted yet"
                action={<Link to="/employer/jobs/new" className="btn btn-primary btn-sm">Post First Job</Link>} />
            : myJobs.map(job => (
              <div key={job._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{job.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {job.applicationsCount || 0} applicants • {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <StatusBadge status={job.status} />
                  <Link to={`/employer/applications?jobId=${job._id}`} className="btn btn-ghost btn-sm">View</Link>
                </div>
              </div>
            ))
          }
        </Card>

        {/* Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 14 }}>Quick Actions</h3>
            {[
              { to: '/employer/jobs/new',        icon: '➕', label: 'Post a New Job',      desc: 'Create a job listing' },
              { to: '/employer/company',          icon: '🏢', label: 'Edit Company Profile', desc: 'Update your company info' },
              { to: '/employer/resumes',          icon: '🔍', label: 'Search Candidates',    desc: 'Browse talent pool' },
              { to: '/employer/packages',         icon: '📦', label: 'Manage Subscription',  desc: 'View your plan' },
            ].map(link => (
              <Link key={link.to} to={link.to} style={{ display: 'flex', gap: 12, alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--gray-100)', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--gray-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {link.icon}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{link.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>{link.desc}</p>
                </div>
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// POST / EDIT JOB PAGE
// ══════════════════════════════════════════════════════════════
export const PostJobPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categories, jobTypes, careerLevels, education, currencies } = useLookup()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', qualifications: '', prefferdSkills: '',
    categoryId: '', jobType: '', careerLevel: '', educationId: '',
    city: '', workplaceType: 'onsite', currency: 'INR',
    salaryMin: '', salaryMax: '', hideSalaryRange: false,
    experience: 0, noOfJobs: 1, isUrgent: false,
    jobApplyLink: false, jobLink: '',
    tags: '', status: 'pending',
  })

  // Load existing job for edit
  useEffect(() => {
    if (id) {
      jobsAPI.getOne(id).then(res => {
        const j = res.data.job
        setForm({
          title: j.title || '', description: j.description || '',
          qualifications: j.qualifications || '', prefferdSkills: j.prefferdSkills || '',
          categoryId: j.categoryId?._id || '', jobType: j.jobType?._id || '',
          careerLevel: j.careerLevel?._id || '', educationId: j.educationId?._id || '',
          city: j.city || '', workplaceType: j.workplaceType || 'onsite',
          currency: j.currency || 'INR', salaryMin: j.salaryMin || '',
          salaryMax: j.salaryMax || '', hideSalaryRange: j.hideSalaryRange || false,
          experience: j.experience || 0, noOfJobs: j.noOfJobs || 1,
          isUrgent: j.isUrgent || false, jobApplyLink: j.jobApplyLink || false,
          jobLink: j.jobLink || '', tags: j.tags?.join(', ') || '',
          status: j.status || 'pending',
        })
      }).catch(() => navigate('/employer/jobs'))
    }
  }, [id])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Job title required')
    if (!form.description.trim()) return toast.error('Job description required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        salaryMin: Number(form.salaryMin) || undefined,
        salaryMax: Number(form.salaryMax) || undefined,
        experience: Number(form.experience),
        noOfJobs: Number(form.noOfJobs),
      }
      if (id) {
        await jobsAPI.update(id, payload)
        toast.success('Job updated!')
      } else {
        await jobsAPI.create(payload)
        toast.success('Job posted! Pending review.')
      }
      navigate('/employer/jobs')
    } catch {}
    finally { setSaving(false) }
  }

  const SectionTitle = ({ title, desc }) => (
    <div style={{ borderBottom: '1px solid var(--gray-200)', paddingBottom: 12, marginBottom: 20, marginTop: 32 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{title}</h3>
      {desc && <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 3 }}>{desc}</p>}
    </div>
  )

  return (
    <DashboardLayout role="employer" pageTitle={id ? 'Edit Job' : 'Post a Job'}>
      <div className="page-header">
        <h1>{id ? 'Edit Job' : 'Post a New Job'}</h1>
        <p>Fill in the details to {id ? 'update' : 'create'} your job listing</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {/* Main */}
          <div>
            <Card>
              <SectionTitle title="Basic Information" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input label="Job Title *" value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Senior React Developer" required />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Select label="Category" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.catTitle}</option>)}
                  </Select>
                  <Select label="Job Type" value={form.jobType} onChange={e => set('jobType', e.target.value)}>
                    <option value="">Select Type</option>
                    {jobTypes.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                  </Select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Select label="Career Level" value={form.careerLevel} onChange={e => set('careerLevel', e.target.value)}>
                    <option value="">Select Level</option>
                    {careerLevels.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                  </Select>
                  <Select label="Education" value={form.educationId} onChange={e => set('educationId', e.target.value)}>
                    <option value="">Select Education</option>
                    {education.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                  </Select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
                  <Select label="Workplace Type" value={form.workplaceType} onChange={e => set('workplaceType', e.target.value)}>
                    <option value="onsite">Onsite</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </Select>
                </div>
              </div>

              <SectionTitle title="Job Description *" desc="Describe the role, responsibilities, and what makes it great" />
              <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={8} placeholder="Enter detailed job description..." required />

              <SectionTitle title="Qualifications" />
              <Textarea value={form.qualifications} onChange={e => set('qualifications', e.target.value)}
                rows={4} placeholder="Required qualifications and certifications..." />

              <SectionTitle title="Preferred Skills" />
              <Textarea value={form.prefferdSkills} onChange={e => set('prefferdSkills', e.target.value)}
                rows={3} placeholder="React, Node.js, MongoDB, AWS..." />

              <SectionTitle title="Tags" desc="Comma-separated keywords for better search visibility" />
              <Input value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder="javascript, react, frontend, remote..." />
            </Card>
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: 80 }}>
            <Card style={{ marginBottom: 16 }}>
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: 15 }}>Salary & Compensation</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Select label="Currency" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </Select>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Input label="Min Salary" type="number" value={form.salaryMin}
                    onChange={e => set('salaryMin', e.target.value)} placeholder="30000" />
                  <Input label="Max Salary" type="number" value={form.salaryMax}
                    onChange={e => set('salaryMax', e.target.value)} placeholder="60000" />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--gray-600)' }}>
                  <input type="checkbox" checked={form.hideSalaryRange} onChange={e => set('hideSalaryRange', e.target.checked)} />
                  Hide salary from candidates
                </label>
              </div>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: 15 }}>Job Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Experience Required (years)</label>
                  <input type="range" min={0} max={20} value={form.experience}
                    onChange={e => set('experience', e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--brand-600)' }} />
                  <p style={{ fontSize: 13, color: 'var(--gray-500)', textAlign: 'center' }}>
                    {form.experience} {form.experience == 1 ? 'year' : 'years'}
                  </p>
                </div>
                <Input label="Number of Openings" type="number" min={1} value={form.noOfJobs}
                  onChange={e => set('noOfJobs', e.target.value)} />
              </div>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: 15 }}>Options</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { key: 'isUrgent', label: '🔴 Mark as Urgent' },
                  { key: 'jobApplyLink', label: '🔗 External Apply Link' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--gray-600)' }}>
                    <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
                {form.jobApplyLink && (
                  <Input value={form.jobLink} onChange={e => set('jobLink', e.target.value)}
                    placeholder="https://your-site.com/apply" />
                )}
              </div>
            </Card>

            <Button type="submit" loading={saving} style={{ width: '100%', padding: '13px', fontSize: 15 }}>
              {id ? 'Update Job' : 'Post Job →'}
            </Button>
            <Button type="button" variant="ghost" style={{ width: '100%', marginTop: 8 }}
              onClick={() => navigate('/employer/jobs')}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// MY JOBS PAGE
// ══════════════════════════════════════════════════════════════
export const MyJobsPage = () => {
  const [jobs, setJobs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const { page, limit, goTo } = usePagination(1, 10)
  const [deleteId, setDeleteId] = useState(null)

  const fetchJobs = useCallback(() => {
    setLoading(true)
    const params = { page, limit }
    if (statusFilter) params.status = statusFilter
    jobsAPI.getMyJobs(params)
      .then(res => { setJobs(res.data.data || []); setTotal(res.data.pagination?.total || 0) })
      .finally(() => setLoading(false))
  }, [page, limit, statusFilter])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const handleDelete = async () => {
    try {
      await jobsAPI.remove(deleteId)
      toast.success('Job deleted')
      fetchJobs()
    } catch {}
    setDeleteId(null)
  }

  const statuses = ['', 'active', 'approved', 'pending', 'paused', 'expired', 'draft']

  return (
    <DashboardLayout role="employer" pageTitle="My Jobs">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h1>My Job Postings</h1>
          <p>{total} total jobs</p>
        </div>
        <Link to="/employer/jobs/new" className="btn btn-primary">+ Post New Job</Link>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['All', 'Approved', 'Pending', 'Paused', 'Expired'].map(s => {
          const val = s === 'All' ? '' : s.toLowerCase()
          return (
            <button key={s} onClick={() => setStatusFilter(val)}
              className={`btn btn-sm ${statusFilter === val ? 'btn-primary' : 'btn-ghost'}`}>
              {s}
            </button>
          )
        })}
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
        : jobs.length === 0 ? (
          <EmptyState icon="💼" title="No jobs yet"
            action={<Link to="/employer/jobs/new" className="btn btn-primary">Post First Job</Link>} />
        ) : (
          <div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Applications</th>
                    <th>Posted</th>
                    <th>Expires</th>
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
                      <td>
                        <Link to={`/employer/applications?jobId=${job._id}`}
                          style={{ fontWeight: 700, color: 'var(--brand-600)', fontSize: 15 }}>
                          {job.applicationsCount || 0}
                        </Link>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                        {job.expiresAt ? format(new Date(job.expiresAt), 'PP') : '—'}
                      </td>
                      <td><StatusBadge status={job.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/employer/jobs/${job._id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                          <Link to={`/employer/applications?jobId=${job._id}`} className="btn btn-outline btn-sm">Applicants</Link>
                          <button onClick={() => setDeleteId(job._id)} className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--error)' }}>Delete</button>
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

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Job" message="Are you sure you want to delete this job? All applications will be affected."
        confirmLabel="Delete" danger />
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// APPLICANTS PAGE
// ══════════════════════════════════════════════════════════════
export const ApplicantsPage = () => {
  const [apps, setApps] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState(new URLSearchParams(window.location.search).get('jobId') || '')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedApp, setSelectedApp] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [updateForm, setUpdateForm] = useState({ status: '', note: '', rating: 0 })
  const { page, limit, goTo } = usePagination(1, 20)

  useEffect(() => {
    jobsAPI.getMyJobs({ limit: 100 }).then(res => setJobs(res.data.data || []))
  }, [])

  useEffect(() => {
    if (!selectedJobId) return
    setLoading(true)
    const params = { page, limit }
    if (statusFilter) params.status = statusFilter
    applicationsAPI.getApplicants(selectedJobId, params)
      .then(res => { setApps(res.data.data || []); setTotal(res.data.pagination?.total || 0) })
      .finally(() => setLoading(false))
  }, [selectedJobId, statusFilter, page, limit])

  const handleUpdateStatus = async () => {
    if (!updateForm.status) return toast.error('Select a status')
    setUpdating(true)
    try {
      await applicationsAPI.updateStatus(selectedApp._id, updateForm)
      setApps(prev => prev.map(a => a._id === selectedApp._id ? { ...a, status: updateForm.status } : a))
      setSelectedApp(null)
      toast.success('Status updated!')
    } catch {}
    finally { setUpdating(false) }
  }

  const statusOptions = ['reviewed', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected']

  return (
    <DashboardLayout role="employer" pageTitle="Applications">
      <div className="page-header">
        <h1>Job Applications</h1>
        <p>Review and manage candidate applications</p>
      </div>

      {/* Job selector */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'end' }}>
          <Select label="Select Job" value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}>
            <option value="">-- Choose a job --</option>
            {jobs.map(j => <option key={j._id} value={j._id}>{j.title} ({j.applicationsCount || 0} applicants)</option>)}
          </Select>
          <Select label="Filter Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </Select>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', paddingBottom: 4 }}>{total} applicants</div>
        </div>
      </Card>

      {!selectedJobId ? (
        <EmptyState icon="📋" title="Select a job to view applications" />
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
      ) : apps.length === 0 ? (
        <EmptyState icon="👥" title="No applications yet" desc="Share your job link to attract more candidates" />
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {apps.map(app => (
              <motion.div key={app._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <Avatar src={app.uid?.avatar?.secureUrl} name={`${app.uid?.firstName} ${app.uid?.lastName}`} size="md" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)' }}>
                            {app.uid?.firstName} {app.uid?.lastName}
                          </h3>
                          <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                            {app.uid?.email} • Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <StatusBadge status={app.status} />
                          {app.rating > 0 && (
                            <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                              {'⭐'.repeat(Math.round(app.rating))} {app.rating}/5
                            </span>
                          )}
                        </div>
                      </div>
                      {app.applyMessage && (
                        <p style={{ marginTop: 10, fontSize: 13, color: 'var(--gray-600)', background: 'var(--gray-50)',
                          padding: '8px 12px', borderRadius: 8, lineHeight: 1.6 }}>
                          {app.applyMessage}
                        </p>
                      )}
                      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <button onClick={() => { setSelectedApp(app); setUpdateForm({ status: app.status, note: '', rating: app.rating || 0 }) }}
                          className="btn btn-primary btn-sm">
                          Update Status
                        </button>
                        {app.cvId && (
                          <button onClick={async () => {
                            const res = await applicationsAPI.viewResume(app._id)
                            window.open(res.data.resume?.files?.[0]?.secureUrl, '_blank')
                          }} className="btn btn-outline btn-sm">
                            View Resume
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          <Pagination page={page} total={total} limit={limit} onChange={goTo} />
        </div>
      )}

      {/* Update Status Modal */}
      <Modal open={!!selectedApp} onClose={() => setSelectedApp(null)} title="Update Application Status" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--gray-50)', borderRadius: 10 }}>
            <Avatar src={selectedApp?.uid?.avatar?.secureUrl} name={`${selectedApp?.uid?.firstName}`} size="sm" />
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{selectedApp?.uid?.firstName} {selectedApp?.uid?.lastName}</p>
              <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{selectedApp?.uid?.email}</p>
            </div>
          </div>

          <Select label="New Status" value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}>
            <option value="">Select Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </Select>

          <div className="form-group">
            <label className="form-label">Rating (1-5)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setUpdateForm(f => ({ ...f, rating: n }))}
                  style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer',
                    filter: updateForm.rating >= n ? 'none' : 'grayscale(1) opacity(.3)' }}>
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <Textarea label="Note to Candidate (Optional)" value={updateForm.note}
            onChange={e => setUpdateForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Add a note that will be sent to the candidate..." rows={3} />

          {updateForm.status === 'interview_scheduled' && (
            <div style={{ background: 'var(--brand-50)', padding: 12, borderRadius: 10, fontSize: 13, color: 'var(--brand-700)' }}>
              ℹ️ The candidate will receive an email notification about the interview.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setSelectedApp(null)}>Cancel</Button>
            <Button loading={updating} onClick={handleUpdateStatus}>Update</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPANY PROFILE PAGE
// ══════════════════════════════════════════════════════════════
export const CompanyProfilePage = () => {
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [logoFile, setLogoFile] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    companiesAPI.getMe().then(res => {
      setCompany(res.data.company)
      setForm({
        name: res.data.company.name, tagline: res.data.company.tagline || '',
        description: res.data.company.description || '',
        url: res.data.company.url || '', contactEmail: res.data.company.contactEmail || '',
        city: res.data.company.city || '',
        socialLinks: res.data.company.socialLinks || {},
      })
    }).catch(() => setCreating(true)).finally(() => setLoading(false))
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (creating) {
        const res = await companiesAPI.create(form)
        setCompany(res.data.company)
        setCreating(false)
        toast.success('Company profile created!')
      } else {
        const res = await companiesAPI.update(form)
        setCompany(res.data.company)
        toast.success('Company profile updated!')
      }
    } catch {}
    finally { setSaving(false) }
  }

  const handleLogoUpload = async (file) => {
    const formData = new FormData()
    formData.append('logo', file)
    try {
      const res = await companiesAPI.uploadLogo(formData)
      setCompany(c => ({ ...c, logo: res.data.logo }))
      toast.success('Logo updated!')
    } catch {}
  }

  if (loading) return <DashboardLayout role="employer" pageTitle="Company Profile"><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div></DashboardLayout>

  return (
    <DashboardLayout role="employer" pageTitle="Company Profile">
      <div className="page-header">
        <h1>Company Profile</h1>
        <p>{creating ? 'Create your company profile to start posting jobs' : 'Manage your company information'}</p>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card>
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: 15 }}>Basic Info</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input label="Company Name *" value={form.name || ''} onChange={e => set('name', e.target.value)} required />
                <Input label="Tagline" value={form.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="We're building the future..." />
                <Textarea label="About Company" value={form.description || ''} onChange={e => set('description', e.target.value)} rows={5} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Website" value={form.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://company.com" />
                  <Input label="Contact Email" type="email" value={form.contactEmail || ''} onChange={e => set('contactEmail', e.target.value)} />
                </div>
                <Input label="City" value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
              </div>
            </Card>

            <Card>
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: 15 }}>Social Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['linkedin', 'twitter', 'facebook', 'youtube'].map(platform => (
                  <Input key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                    value={form.socialLinks?.[platform] || ''}
                    onChange={e => set('socialLinks', { ...form.socialLinks, [platform]: e.target.value })}
                    placeholder={`https://${platform}.com/yourcompany`} />
                ))}
              </div>
            </Card>
          </div>

          <div style={{ position: 'sticky', top: 80 }}>
            {/* Logo */}
            <Card style={{ marginBottom: 16, textAlign: 'center' }}>
              <div style={{ width: 100, height: 100, borderRadius: 16, overflow: 'hidden', margin: '0 auto 16px',
                background: 'var(--brand-50)', border: '2px dashed var(--gray-300)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {company?.logo?.secureUrl
                  ? <img src={company.logo.secureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 36, color: 'var(--brand-300)' }}>🏢</span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>Upload company logo</p>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                Choose Logo
                <input type="file" accept="image/*" hidden onChange={e => e.target.files[0] && handleLogoUpload(e.target.files[0])} />
              </label>
            </Card>

            {/* Status */}
            {company && (
              <Card style={{ marginBottom: 16 }}>
                <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 12, fontSize: 14 }}>Profile Status</h4>
                {[
                  ['Verified', company.isVerified ? '✅' : '⏳'],
                  ['Jobs Posted', company.jobsCount || 0],
                  ['Followers', company.followersCount || 0],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13,
                    padding: '7px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ color: 'var(--gray-500)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </Card>
            )}

            <Button type="submit" loading={saving} style={{ width: '100%', padding: '13px' }}>
              {creating ? 'Create Company' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}

// ══════════════════════════════════════════════════════════════
// RESUME SEARCH PAGE (Employer)
// ══════════════════════════════════════════════════════════════
export const ResumeSearchPage = () => {
  const [resumes, setResumes] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('')
  const { page, limit, goTo } = usePagination(1, 12)

  const search = useCallback(() => {
    setLoading(true)
    resumesAPI.search({ keyword, city, page, limit })
      .then(res => { setResumes(res.data.data || []); setTotal(res.data.pagination?.total || 0) })
      .finally(() => setLoading(false))
  }, [keyword, city, page, limit])

  useEffect(() => { search() }, [page])

  return (
    <DashboardLayout role="employer" pageTitle="Search Resumes">
      <div className="page-header">
        <h1>Search Candidates</h1>
        <p>Find the perfect candidate from our talent pool</p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <Input label="Keywords / Skills" value={keyword} onChange={e => setKeyword(e.target.value)}
            placeholder="React, Python, Marketing..." onKeyDown={e => e.key === 'Enter' && search()} />
          <Input label="City" value={city} onChange={e => setCity(e.target.value)}
            placeholder="Mumbai, Delhi..." onKeyDown={e => e.key === 'Enter' && search()} />
          <Button onClick={search} style={{ height: 42 }}>Search</Button>
        </div>
      </Card>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
        : resumes.length === 0 ? <EmptyState icon="🔍" title="No resumes found" desc="Try different keywords or broaden your search" />
        : (
          <div>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 16 }}>{total} candidates found</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {resumes.map(r => (
                <Card key={r._id} hover>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                    <Avatar src={r.uid?.avatar?.secureUrl} name={`${r.uid?.firstName} ${r.uid?.lastName}`} size="md" />
                    <div>
                      <h3 style={{ fontSize: 14, fontFamily: 'var(--font-display)' }}>{r.applicationTitle}</h3>
                      {r.visibility !== 'private' && (
                        <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{r.uid?.firstName} {r.uid?.lastName}</p>
                      )}
                    </div>
                  </div>
                  {r.skills && (
                    <p style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 10, lineHeight: 1.5 }}>
                      🛠 {r.skills.slice(0, 80)}...
                    </p>
                  )}
                  {r.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                      {r.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="badge badge-blue" style={{ fontSize: 11 }}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/resumes/${r._id}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                      View Profile
                    </Link>
                    <button onClick={() => {/* start conversation */}}
                      className="btn btn-ghost btn-sm" title="Message">💬</button>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination page={page} total={total} limit={limit} onChange={goTo} />
          </div>
        )
      }
    </DashboardLayout>
  )
}
