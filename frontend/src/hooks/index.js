import { useState, useEffect, useCallback, useRef } from 'react'
import { lookupAPI } from '../api'

// ── Debounce ───────────────────────────────────────────────────────────────
export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── Fetch lookup data ──────────────────────────────────────────────────────
export const useLookup = () => {
  const [data, setData] = useState({
    categories: [], jobTypes: [], careerLevels: [],
    education: [], currencies: [], countries: [],
  })

  useEffect(() => {
    Promise.allSettled([
      lookupAPI.categories(),
      lookupAPI.jobTypes(),
      lookupAPI.careerLevels(),
      lookupAPI.education(),
      lookupAPI.currencies(),
      lookupAPI.countries(),
    ]).then(([cats, types, levels, edu, curr, countries]) => {
      setData({
        categories:   cats.value?.data?.data   || [],
        jobTypes:     types.value?.data?.data  || [],
        careerLevels: levels.value?.data?.data || [],
        education:    edu.value?.data?.data    || [],
        currencies:   curr.value?.data?.data   || [],
        countries:    countries.value?.data?.data || [],
      })
    })
  }, [])

  return data
}

// ── Pagination ─────────────────────────────────────────────────────────────
export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)

  const goTo   = (p) => setPage(p)
  const next   = () => setPage(p => p + 1)
  const prev   = () => setPage(p => Math.max(1, p - 1))
  const reset  = () => setPage(1)

  return { page, limit, goTo, next, prev, reset }
}

// ── Click outside ─────────────────────────────────────────────────────────
export const useClickOutside = (handler) => {
  const ref = useRef()
  useEffect(() => {
    const listener = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [handler])
  return ref
}

// ── Local storage ──────────────────────────────────────────────────────────
export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initialValue }
    catch { return initialValue }
  })

  const setStoredValue = useCallback((val) => {
    setValue(val)
    localStorage.setItem(key, JSON.stringify(val))
  }, [key])

  return [value, setStoredValue]
}

// ── Media query ────────────────────────────────────────────────────────────
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

export const useIsMobile = () => useMediaQuery('(max-width: 768px)')
