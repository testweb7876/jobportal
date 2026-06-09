import { useState, useEffect } from 'react'
import { useLookup } from '../../hooks'
import { Button } from '../../components/common'

const JobFilters = ({ filters, onChange, onReset }) => {
  const { categories, jobTypes, careerLevels } = useLookup()
  const [local, setLocal] = useState(filters)

  useEffect(() => { setLocal(filters) }, [filters])

  const set = (key, val) => {
    const updated = { ...local, [key]: val }
    setLocal(updated)
    onChange(updated)
  }

  const FilterSection = ({ title, children }) => (
    <div style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: 20, marginBottom: 20 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 12,
        textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--font-display)' }}>{title}</h4>
      {children}
    </div>
  )

  const CheckItem = ({ label, value, checked, onChange }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: 'var(--brand-600)', width: 15, height: 15 }} />
      <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>{label}</span>
    </label>
  )

  return (
    <div className="card" style={{ position: 'sticky', top: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)' }}>Filters</h3>
        <button onClick={onReset} style={{ fontSize: 12, color: 'var(--brand-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Reset All
        </button>
      </div>

      <FilterSection title="Workplace">
        {['onsite', 'remote', 'hybrid'].map(type => (
          <CheckItem key={type} label={type.charAt(0).toUpperCase() + type.slice(1)}
            checked={local.workplaceType === type}
            onChange={c => set('workplaceType', c ? type : '')} />
        ))}
      </FilterSection>

      <FilterSection title="Job Type">
        {jobTypes.map(jt => (
          <CheckItem key={jt._id} label={jt.title}
            checked={local.jobType === jt._id}
            onChange={c => set('jobType', c ? jt._id : '')} />
        ))}
      </FilterSection>

      <FilterSection title="Category">
        {categories.slice(0, 8).map(cat => (
          <CheckItem key={cat._id} label={cat.catTitle}
            checked={local.category === cat._id}
            onChange={c => set('category', c ? cat._id : '')} />
        ))}
      </FilterSection>

      <FilterSection title="Career Level">
        {careerLevels.map(cl => (
          <CheckItem key={cl._id} label={cl.title}
            checked={local.careerLevel === cl._id}
            onChange={c => set('careerLevel', c ? cl._id : '')} />
        ))}
      </FilterSection>

      <FilterSection title="Salary Range (₹)">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" placeholder="Min" value={local.salaryMin || ''}
            onChange={e => set('salaryMin', e.target.value)}
            className="form-input" style={{ fontSize: 13, padding: '8px 10px' }} />
          <span style={{ color: 'var(--gray-400)' }}>–</span>
          <input type="number" placeholder="Max" value={local.salaryMax || ''}
            onChange={e => set('salaryMax', e.target.value)}
            className="form-input" style={{ fontSize: 13, padding: '8px 10px' }} />
        </div>
      </FilterSection>

      <FilterSection title="Experience (Years)">
        <input type="range" min={0} max={20} value={local.experience || 0}
          onChange={e => set('experience', e.target.value)}
          style={{ width: '100%', accentColor: 'var(--brand-600)' }} />
        <p style={{ fontSize: 13, color: 'var(--gray-500)', textAlign: 'center', marginTop: 6 }}>
          Up to {local.experience || 0} {local.experience == 1 ? 'year' : 'years'}
        </p>
      </FilterSection>

      <div>
        <CheckItem label="Urgent Jobs Only" checked={!!local.isUrgent}
          onChange={c => set('isUrgent', c)} />
        <CheckItem label="Featured Jobs Only" checked={!!local.isFeatured}
          onChange={c => set('isFeatured', c)} />
      </div>
    </div>
  )
}

export default JobFilters
