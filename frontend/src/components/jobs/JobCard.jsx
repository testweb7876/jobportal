import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { StatusBadge } from '../../components/common'

const JobCard = ({ job, onShortlist, isShortlisted, compact }) => {
  const logo = job.companyId?.logo?.secureUrl
  const companyName = job.companyId?.name || job.company || 'Company'
  const timeAgo = job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : ''

  const salaryText = () => {
    if (job.hideSalaryRange || (!job.salaryMin && !job.salaryMax)) return null
    const curr = job.currency || '₹'
    const fmt = (n) => n >= 100000 ? `${(n/100000).toFixed(1)}L` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : n
    if (job.salaryMin && job.salaryMax) return `${curr}${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`
    if (job.salaryMin) return `From ${curr}${fmt(job.salaryMin)}`
    return null
  }

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
      <div className="card" style={{ padding: compact ? 16 : 22, position: 'relative' }}>
        {/* Urgent tag */}
        {job.isUrgent && (
          <span style={{ position: 'absolute', top: 16, right: 16,
            background: '#fef2f2', color: '#b91c1c', fontSize: 11, fontWeight: 700,
            padding: '2px 8px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}>
            🔴 Urgent
          </span>
        )}

        {/* Featured tag */}
        {job.isFeaturedJob && !job.isUrgent && (
          <span style={{ position: 'absolute', top: 16, right: 16,
            background: '#faf5ff', color: '#6d28d9', fontSize: 11, fontWeight: 700,
            padding: '2px 8px', borderRadius: 99 }}>
            ⭐ Featured
          </span>
        )}

        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {/* Logo */}
          <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
            background: 'var(--brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--gray-200)', fontWeight: 700, color: 'var(--brand-600)', fontSize: 18 }}>
            {logo ? <img src={logo} alt={companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : companyName[0]}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to={`/jobs/${job.slug || job._id}`}
              style={{ display: 'block', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)',
                color: 'var(--gray-900)', marginBottom: 4, textDecoration: 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.target.style.color = 'var(--brand-600)'}
              onMouseLeave={e => e.target.style.color = 'var(--gray-900)'}>
              {job.title}
            </Link>

            <Link to={`/companies/${job.companyId?.slug || job.companyId?._id}`}
              style={{ fontSize: 13, color: 'var(--gray-500)', textDecoration: 'none', display: 'block', marginBottom: 10 }}
              onMouseEnter={e => e.target.style.color = 'var(--brand-600)'}
              onMouseLeave={e => e.target.style.color = 'var(--gray-500)'}>
              {companyName}
            </Link>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {job.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--gray-500)' }}>
                  📍 {job.city}
                </span>
              )}
              {job.workplaceType && (
                <span className="badge badge-blue">{job.workplaceType}</span>
              )}
              {job.jobType?.title && (
                <span className="badge badge-gray">{job.jobType.title}</span>
              )}
              {salaryText() && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                  💰 {salaryText()}
                </span>
              )}
              {job.experience > 0 && (
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                  {job.experience}+ yrs exp
                </span>
              )}
            </div>
          </div>
        </div>

        {!compact && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--gray-100)' }}>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{timeAgo}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {onShortlist && (
                <button onClick={(e) => { e.preventDefault(); onShortlist(job._id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8,
                    color: isShortlisted ? '#ef4444' : 'var(--gray-400)', transition: 'all .15s',
                    fontSize: 18 }}>
                  {isShortlisted ? '❤️' : '🤍'}
                </button>
              )}
              <Link to={`/jobs/${job.slug || job._id}`} className="btn btn-outline btn-sm">
                View Job
              </Link>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default JobCard
