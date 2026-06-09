import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { jobsAPI, companiesAPI, applicationsAPI } from '../../api'
import { selectUser } from '../../store'
import { Button, Card, EmptyState, Pagination, Spinner, StatusBadge, SearchBar, SkeletonCard } from '../../components/common'
import JobCard from '../../components/jobs/JobCard'
import JobFilters from '../../components/jobs/JobFilters'
import { Navbar } from '../../components/layout'
import { useDebounce, usePagination } from '../../hooks'
import toast from 'react-hot-toast'

// ══════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════
export const HomePage = () => {
  const [featured, setFeatured] = useState([])
  const [stats] = useState({ jobs: '50,000+', companies: '10,000+', candidates: '200,000+' })
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()
  const user = useSelector(selectUser)

  useEffect(() => {
    jobsAPI.getFeatured().then(r => setFeatured(r.data.jobs || [])).catch(() => {})
  }, [])

  const handleSearch = () => {
    const p = new URLSearchParams()
    if (keyword) p.set('keyword', keyword)
    if (location) p.set('city', location)
    navigate(`/jobs?${p}`)
  }

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--gray-900) 0%, var(--brand-900) 100%)',
        padding: '100px 0 80px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400,
          borderRadius: '50%', background: 'var(--brand-600)', opacity: .08 }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300,
          borderRadius: '50%', background: 'var(--brand-400)', opacity: .06 }} />

        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,.1)', color: 'var(--brand-300)',
              padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, marginBottom: 20,
              border: '1px solid rgba(255,255,255,.1)' }}>
              🚀 India's #1 Job Platform
            </span>
            <h1 style={{ fontSize: 'clamp(32px, 6vw, 60px)', fontWeight: 800, color: '#fff',
              lineHeight: 1.1, marginBottom: 20, fontFamily: 'var(--font-display)' }}>
              Find Your Dream Job<br />
              <span style={{ color: 'var(--brand-300)' }}>or Perfect Hire</span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,.6)', marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
              Connect with top companies and talented professionals across India and beyond.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 12, display: 'flex', gap: 10,
              maxWidth: 700, margin: '0 auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input value={keyword} onChange={e => setKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Job title, skills, company..."
                  style={{ width: '100%', padding: '10px 12px 10px 36px', border: 'none', outline: 'none', fontSize: 15, borderRadius: 8 }} />
              </div>
              <div style={{ width: 1, background: 'var(--gray-200)', margin: '4px 0' }} />
              <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="City, State..."
                  style={{ width: '100%', padding: '10px 12px 10px 36px', border: 'none', outline: 'none', fontSize: 15, borderRadius: 8 }} />
              </div>
              <Button onClick={handleSearch} size="lg" style={{ borderRadius: 10, paddingLeft: 28, paddingRight: 28 }}>
                Search Jobs
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--brand-600)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: 60, flexWrap: 'wrap' }}>
          {[
            { label: 'Active Jobs', value: stats.jobs },
            { label: 'Companies', value: stats.companies },
            { label: 'Candidates', value: stats.candidates },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', color: '#fff' }}>
              <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{s.value}</p>
              <p style={{ fontSize: 13, opacity: .8 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Jobs */}
      {featured.length > 0 && (
        <section style={{ padding: '72px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div>
                <h2 style={{ fontSize: 28, fontFamily: 'var(--font-display)' }}>Featured Jobs</h2>
                <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Hand-picked opportunities from top employers</p>
              </div>
              <Link to="/jobs" className="btn btn-outline btn-sm">View All →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {featured.slice(0, 6).map((job, i) => (
                <motion.div key={job._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}>
                  <JobCard job={job} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: '80px 0', background: 'var(--gray-900)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
            Ready to Get Started?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.5)', marginBottom: 32, fontSize: 17 }}>
            Join thousands of professionals and companies already on JobPortal
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register?role=jobseeker" className="btn btn-primary btn-lg">Find a Job</Link>
            <Link to="/register?role=employer"
              className="btn btn-lg" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.2)' }}>
              Post a Job
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// JOBS LIST PAGE
// ══════════════════════════════════════════════════════════════
export const JobsPage = () => {
  const [jobs, setJobs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const { page, limit, goTo, reset } = usePagination(1, 12)
  const user = useSelector(selectUser)

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [shortlisted, setShortlisted] = useState(new Set())
  const debouncedKeyword = useDebounce(keyword, 500)

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    jobType: searchParams.get('jobType') || '',
    category: searchParams.get('category') || '',
    careerLevel: '',
    workplaceType: '',
    salaryMin: '',
    salaryMax: '',
    experience: 0,
    isUrgent: false,
    isFeatured: false,
  })

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit, ...filters }
      if (debouncedKeyword) params.keyword = debouncedKeyword
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const res = await jobsAPI.getAll(params)
      setJobs(res.data.data || [])
      setTotal(res.data.pagination?.total || 0)
    } catch {}
    finally { setLoading(false) }
  }, [page, limit, filters, debouncedKeyword])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const handleShortlist = async (jobId) => {
    if (!user) return toast.error('Please login to save jobs')
    try {
      const res = await jobsAPI.shortlist(jobId)
      setShortlisted(prev => {
        const next = new Set(prev)
        res.data.shortlisted ? next.add(jobId) : next.delete(jobId)
        return next
      })
    } catch {}
  }

  return (
    <div>
      <Navbar />
      <div style={{ background: 'var(--gray-900)', padding: '40px 0' }}>
        <div className="container">
          <h1 style={{ color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: 32 }}>
            Find Your Next Job
          </h1>
          <SearchBar value={keyword} onChange={setKeyword} placeholder="Job title, skills, keyword..."
            onSearch={() => { reset() }} />
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Filters */}
          <div>
            <JobFilters filters={filters} onChange={(f) => { setFilters(f); reset() }}
              onReset={() => { setFilters({ city:'',jobType:'',category:'',careerLevel:'',workplaceType:'',salaryMin:'',salaryMax:'',experience:0,isUrgent:false,isFeatured:false }); reset() }} />
          </div>

          {/* Jobs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
                <strong style={{ color: 'var(--gray-800)' }}>{total.toLocaleString()}</strong> jobs found
              </p>
              <select className="form-input" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
                onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}>
                <option value="">Most Relevant</option>
                <option value="newest">Newest First</option>
                <option value="salary_high">Salary: High to Low</option>
              </select>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState icon="🔍" title="No jobs found"
                desc="Try adjusting your filters or search with different keywords"
                action={<Button onClick={() => setFilters({})}>Clear Filters</Button>} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {jobs.map((job, i) => (
                  <motion.div key={job._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .03 }}>
                    <JobCard job={job} onShortlist={handleShortlist} isShortlisted={shortlisted.has(job._id)} />
                  </motion.div>
                ))}
              </div>
            )}

            <Pagination page={page} total={total} limit={limit} onChange={goTo} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// JOB DETAIL PAGE
// ══════════════════════════════════════════════════════════════
export const JobDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const [job, setJob] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [isShortlisted, setIsShortlisted] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')

  useEffect(() => {
    setLoading(true)
    jobsAPI.getOne(id).then(res => {
      setJob(res.data.job)
      setSimilar(res.data.similarJobs || [])
      setHasApplied(res.data.hasApplied || false)
      setIsShortlisted(res.data.isShortlisted || false)
    }).catch(() => navigate('/jobs'))
    .finally(() => setLoading(false))
  }, [id])

  const handleApply = async () => {
    if (!user) return navigate('/login')
    if (user.role !== 'jobseeker') return toast.error('Only job seekers can apply')
    setApplying(true)
    try {
      await applicationsAPI.apply(job._id, { applyMessage: coverLetter, quickApply: !coverLetter })
      setHasApplied(true)
      setShowApplyModal(false)
      toast.success('Application submitted successfully! 🎉')
    } catch {}
    finally { setApplying(false) }
  }

  const handleShortlist = async () => {
    if (!user) return navigate('/login')
    const res = await jobsAPI.shortlist(job._id)
    setIsShortlisted(res.data.shortlisted)
    toast.success(res.data.shortlisted ? 'Job saved!' : 'Job removed from saved')
  }

  if (loading) return (
    <div><Navbar />
      <div className="container" style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
        <Spinner size={40} />
      </div>
    </div>
  )

  if (!job) return null

  const logo = job.companyId?.logo?.secureUrl

  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {/* Main */}
          <div>
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
                  background: 'var(--brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--gray-200)', fontWeight: 800, color: 'var(--brand-600)', fontSize: 26 }}>
                  {logo ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : job.companyId?.name?.[0] || 'C'}
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: 26, marginBottom: 6, fontFamily: 'var(--font-display)' }}>{job.title}</h1>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <Link to={`/companies/${job.companyId?.slug}`} style={{ color: 'var(--brand-600)', fontWeight: 600, fontSize: 15 }}>
                      {job.companyId?.name || job.company}
                    </Link>
                    {job.companyId?.isVerified && <span title="Verified" style={{ color: 'var(--brand-500)', fontSize: 16 }}>✓</span>}
                    {job.city && <span style={{ color: 'var(--gray-500)', fontSize: 14 }}>📍 {job.city}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--gray-100)' }}>
                {job.jobType?.title && <span className="badge badge-blue">{job.jobType.title}</span>}
                {job.workplaceType && <span className="badge badge-purple">{job.workplaceType}</span>}
                {job.careerLevel?.title && <span className="badge badge-gray">{job.careerLevel.title}</span>}
                {!job.hideSalaryRange && job.salaryMin && (
                  <span className="badge badge-green">
                    ₹{(job.salaryMin/1000).toFixed(0)}K – ₹{(job.salaryMax/1000).toFixed(0)}K
                  </span>
                )}
                {job.isUrgent && <span className="badge badge-red">🔴 Urgent</span>}
                {job.experience > 0 && <span className="badge badge-gray">{job.experience}+ yrs experience</span>}
              </div>

              {/* Description */}
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>Job Description</h3>
              <div style={{ lineHeight: 1.8, color: 'var(--gray-700)', fontSize: 15, whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: job.description }} />

              {job.qualifications && (
                <>
                  <h3 style={{ fontSize: 18, margin: '24px 0 12px' }}>Qualifications</h3>
                  <div style={{ lineHeight: 1.8, color: 'var(--gray-700)', fontSize: 15, whiteSpace: 'pre-wrap' }}
                    dangerouslySetInnerHTML={{ __html: job.qualifications }} />
                </>
              )}

              {job.prefferdSkills && (
                <>
                  <h3 style={{ fontSize: 18, margin: '24px 0 12px' }}>Preferred Skills</h3>
                  <p style={{ color: 'var(--gray-700)', lineHeight: 1.8 }}>{job.prefferdSkills}</p>
                </>
              )}
            </Card>

            {/* Similar Jobs */}
            {similar.length > 0 && (
              <div>
                <h3 style={{ fontSize: 18, marginBottom: 16 }}>Similar Jobs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {similar.map(j => <JobCard key={j._id} job={j} compact />)}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: 80 }}>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                {hasApplied ? (
                  <button disabled className="btn btn-primary" style={{ flex: 1, opacity: .7, cursor: 'not-allowed' }}>
                    ✓ Applied
                  </button>
                ) : job.isExternalApply ? (
                  <a href={job.jobLink} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                    Apply Now ↗
                  </a>
                ) : (
                  <Button style={{ flex: 1 }} onClick={() => setShowApplyModal(true)}>
                    Apply Now
                  </Button>
                )}
                <button onClick={handleShortlist}
                  className="btn btn-outline" style={{ fontSize: 20, padding: '10px 14px' }}>
                  {isShortlisted ? '❤️' : '🤍'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                {[
                  ['📋', 'Openings', job.noOfJobs || 1],
                  ['📅', 'Posted', job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : '—'],
                  ['⏰', 'Deadline', job.expiresAt ? new Date(job.expiresAt).toLocaleDateString() : 'Open'],
                  ['👥', 'Applications', job.applicationsCount || 0],
                ].map(([icon, label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ color: 'var(--gray-500)' }}>{icon} {label}</span>
                    <span style={{ fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Company Card */}
            {job.companyId && (
              <Card>
                <h4 style={{ fontSize: 15, marginBottom: 12 }}>About Company</h4>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 12, lineHeight: 1.6 }}>
                  {job.companyId.description?.slice(0, 150)}{job.companyId.description?.length > 150 ? '...' : ''}
                </p>
                <Link to={`/companies/${job.companyId.slug}`} className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  View Company
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20, fontSize: 20 }}>Apply for {job.title}</h3>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Cover Letter (Optional)</label>
              <textarea className="form-input" rows={5} value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                placeholder="Tell the employer why you're a great fit..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowApplyModal(false)}>Cancel</Button>
              <Button loading={applying} onClick={handleApply}>Submit Application</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPANIES PAGE
// ══════════════════════════════════════════════════════════════
export const CompaniesPage = () => {
  const [companies, setCompanies] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { page, limit, goTo } = usePagination(1, 12)
  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    setLoading(true)
    companiesAPI.getAll({ search: debouncedSearch, page, limit })
      .then(res => { setCompanies(res.data.data || []); setTotal(res.data.pagination?.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [debouncedSearch, page, limit])

  return (
    <div>
      <Navbar />
      <div style={{ background: 'var(--gray-900)', padding: '40px 0' }}>
        <div className="container">
          <h1 style={{ color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: 32 }}>Explore Companies</h1>
          <SearchBar value={search} onChange={setSearch} placeholder="Search companies..." />
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        <p style={{ color: 'var(--gray-500)', marginBottom: 24, fontSize: 14 }}>
          <strong style={{ color: 'var(--gray-800)' }}>{total}</strong> companies found
        </p>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {companies.map((company, i) => (
              <motion.div key={company._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}>
                <Link to={`/companies/${company.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="card card-hover">
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                        background: 'var(--brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--gray-200)', fontWeight: 700, color: 'var(--brand-600)', fontSize: 22 }}>
                        {company.logo?.secureUrl
                          ? <img src={company.logo.secureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : company.name[0]}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--gray-900)' }}>{company.name}</h3>
                          {company.isVerified && <span style={{ color: 'var(--brand-500)', fontSize: 14 }}>✓</span>}
                        </div>
                        {company.city && <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>📍 {company.city}</p>}
                      </div>
                    </div>
                    {company.tagline && <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 12, lineHeight: 1.5 }}>{company.tagline.slice(0, 80)}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-500)' }}>
                      <span>👥 {company.followersCount || 0} followers</span>
                      <span>💼 {company.jobsCount || 0} open jobs</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
        <Pagination page={page} total={total} limit={limit} onChange={goTo} />
      </div>
    </div>
  )
}
