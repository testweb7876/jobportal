import { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Spinner ────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20, color = 'var(--brand-600)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'spin .7s linear infinite' }}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeDasharray="40" strokeDashoffset="10"
      strokeLinecap="round" opacity=".25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
)

// ── Button ─────────────────────────────────────────────────────────────────
export const Button = ({ children, variant = 'primary', size = '', loading, className = '', ...props }) => (
  <button
    className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? <Spinner size={16} color="#fff" /> : children}
  </button>
)

// ── Input ──────────────────────────────────────────────────────────────────
export const Input = forwardRef(({ label, error, icon, className = '', ...props }, ref) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <div style={{ position: 'relative' }}>
      {icon && (
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }}>
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={`form-input ${error ? 'error' : ''} ${icon ? 'pl-10' : ''} ${className}`}
        style={icon ? { paddingLeft: 38 } : {}}
        {...props}
      />
    </div>
    {error && <span className="form-error">{error}</span>}
  </div>
))
Input.displayName = 'Input'

// ── Textarea ───────────────────────────────────────────────────────────────
export const Textarea = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <textarea ref={ref} className={`form-input ${error ? 'error' : ''} ${className}`} {...props} />
    {error && <span className="form-error">{error}</span>}
  </div>
))
Textarea.displayName = 'Textarea'

// ── Select ─────────────────────────────────────────────────────────────────
export const Select = forwardRef(({ label, error, children, className = '', ...props }, ref) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <select ref={ref} className={`form-input ${error ? 'error' : ''} ${className}`} {...props}>
      {children}
    </select>
    {error && <span className="form-error">{error}</span>}
  </div>
))
Select.displayName = 'Select'

// ── Modal ──────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  const maxW = { sm: 400, md: 520, lg: 700, xl: 900 }[size] || 520

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}>
          <motion.div className="modal-box" style={{ maxWidth: maxW }}
            initial={{ scale: .95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: .95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>{title}</h3>
              <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', borderRadius: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────
export const Badge = ({ children, color = 'gray' }) => (
  <span className={`badge badge-${color}`}>{children}</span>
)

// ── Avatar ─────────────────────────────────────────────────────────────────
export const Avatar = ({ src, name = '', size = 'md' }) => {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  if (src) return <img src={src} alt={name} className={`avatar avatar-${size}`} />
  return <div className={`avatar avatar-${size}`}>{initials || '?'}</div>
}

// ── Pagination ─────────────────────────────────────────────────────────────
export const Pagination = ({ page, total, limit, onChange }) => {
  const pages = Math.ceil(total / limit)
  if (pages <= 1) return null

  const items = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) items.push(i)
    else if (items[items.length - 1] !== '...') items.push('...')
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => onChange(page - 1)} disabled={page === 1}>←</button>
      {items.map((item, i) => (
        item === '...'
          ? <span key={i} style={{ padding: '6px 4px', color: 'var(--gray-400)' }}>…</span>
          : <button key={item} onClick={() => onChange(item)}
              style={{
                minWidth: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: item === page ? 'var(--brand-600)' : 'transparent',
                color: item === page ? '#fff' : 'var(--gray-600)',
                fontWeight: item === page ? 700 : 400, fontSize: 14,
                transition: 'all .15s',
              }}>
              {item}
            </button>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={() => onChange(page + 1)} disabled={page === pages}>→</button>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, desc, action }) => (
  <div className="empty-state animate-in">
    {icon && <div style={{ fontSize: 56, marginBottom: 12 }}>{icon}</div>}
    <h3>{title}</h3>
    {desc && <p style={{ marginBottom: 20, maxWidth: 360, margin: '8px auto 20px' }}>{desc}</p>}
    {action}
  </div>
)

// ── Card ───────────────────────────────────────────────────────────────────
export const Card = ({ children, hover, className = '', style = {}, ...props }) => (
  <div className={`card ${hover ? 'card-hover' : ''} ${className}`} style={style} {...props}>
    {children}
  </div>
)

// ── Stat Card ──────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon, color = 'var(--brand-600)', trend }) => (
  <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</p>
        <p style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--gray-900)', lineHeight: 1 }}>{value}</p>
        {trend && <p style={{ fontSize: 12, color: trend > 0 ? 'var(--success)' : 'var(--error)', marginTop: 6 }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </p>}
      </div>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
    </div>
  </Card>
)

// ── Search Bar ─────────────────────────────────────────────────────────────
export const SearchBar = ({ value, onChange, placeholder = 'Search...', onSearch }) => (
  <div style={{ position: 'relative', display: 'flex', gap: 10 }}>
    <div style={{ position: 'relative', flex: 1 }}>
      <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        className="form-input"
        style={{ paddingLeft: 40 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && onSearch?.()}
      />
    </div>
    {onSearch && <Button onClick={onSearch}>Search</Button>}
  </div>
)

// ── Status Badge ───────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    applied:              { label: 'Applied',           color: 'blue' },
    reviewed:             { label: 'Reviewed',          color: 'gray' },
    shortlisted:          { label: 'Shortlisted',       color: 'purple' },
    interview_scheduled:  { label: 'Interview',         color: 'yellow' },
    interviewed:          { label: 'Interviewed',       color: 'blue' },
    offered:              { label: 'Offered',           color: 'green' },
    hired:                { label: 'Hired',             color: 'green' },
    rejected:             { label: 'Rejected',          color: 'red' },
    withdrawn:            { label: 'Withdrawn',         color: 'gray' },
    active:               { label: 'Active',            color: 'green' },
    pending:              { label: 'Pending',           color: 'yellow' },
    approved:             { label: 'Approved',          color: 'green' },
    rejected_mod:         { label: 'Rejected',          color: 'red' },
    expired:              { label: 'Expired',           color: 'gray' },
    draft:                { label: 'Draft',             color: 'gray' },
  }
  const s = map[status] || { label: status, color: 'gray' }
  return <Badge color={s.color}>{s.label}</Badge>
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p style={{ color: 'var(--gray-600)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button>
    </div>
  </Modal>
)

// ── Loading Skeleton ───────────────────────────────────────────────────────
export const SkeletonCard = () => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div className="skeleton" style={{ height: 20, width: '60%' }} />
    <div className="skeleton" style={{ height: 14, width: '40%' }} />
    <div className="skeleton" style={{ height: 14, width: '80%' }} />
    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
      <div className="skeleton" style={{ height: 26, width: 70, borderRadius: 99 }} />
      <div className="skeleton" style={{ height: 26, width: 90, borderRadius: 99 }} />
    </div>
  </div>
)

// ── Toggle ─────────────────────────────────────────────────────────────────
export const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
        background: checked ? 'var(--brand-600)' : 'var(--gray-300)',
        transition: 'background .2s',
      }}>
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </div>
    {label && <span style={{ fontSize: 14, color: 'var(--gray-700)' }}>{label}</span>}
  </label>
)
