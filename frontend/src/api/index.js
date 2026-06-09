import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000,
})

// ── Request interceptor ────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor ───────────────────────────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken })
        const { accessToken, refreshToken: newRT } = data

        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRT)

        api.defaults.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)

        return api(original)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    const msg = error.response?.data?.message || 'Something went wrong'
    if (error.response?.status !== 401) toast.error(msg)

    return Promise.reject(error)
  }
)

export default api

// ── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  register:           (data) => api.post('/auth/register', data),
  login:              (data) => api.post('/auth/login', data),
  googleLogin:        (data) => api.post('/auth/google', data),
  logout:             (data) => api.post('/auth/logout', data),
  logoutAll:          ()     => api.post('/auth/logout-all'),
  refreshToken:       (data) => api.post('/auth/refresh-token', data),
  getMe:              ()     => api.get('/auth/me'),
  verifyEmail:        (token)=> api.get(`/auth/verify-email/${token}`),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
  forgotPassword:     (data) => api.post('/auth/forgot-password', data),
  resetPassword:      (token, data) => api.post(`/auth/reset-password/${token}`, data),
  changePassword:     (data) => api.patch('/auth/change-password', data),
  getSessions:        ()     => api.get('/auth/sessions'),
  revokeSession:      (id)   => api.delete(`/auth/sessions/${id}`),
}

// ── Jobs ───────────────────────────────────────────────────────────────────
export const jobsAPI = {
  getAll:       (params)    => api.get('/jobs', { params }),
  getFeatured:  ()          => api.get('/jobs/featured'),
  getOne:       (id)        => api.get(`/jobs/${id}`),
  getMyJobs:    (params)    => api.get('/jobs/my-jobs', { params }),
  create:       (data)      => api.post('/jobs', data),
  update:       (id, data)  => api.patch(`/jobs/${id}`, data),
  remove:       (id)        => api.delete(`/jobs/${id}`),
  shortlist:    (id)        => api.post(`/jobs/${id}/shortlist`),
  getShortlisted: ()        => api.get('/jobs/shortlisted'),
  moderate:     (id, data)  => api.patch(`/jobs/${id}/moderate`, data),
  getAnalytics: (id)        => api.get(`/jobs/analytics/${id}`),
}

// ── Applications ───────────────────────────────────────────────────────────
export const applicationsAPI = {
  apply:          (jobId, data) => api.post(`/applications/jobs/${jobId}/apply`, data),
  getMine:        (params)      => api.get('/applications/mine', { params }),
  withdraw:       (id, data)    => api.patch(`/applications/${id}/withdraw`, data),
  getApplicants:  (jobId, p)    => api.get(`/applications/job/${jobId}`, { params: p }),
  updateStatus:   (id, data)    => api.patch(`/applications/${id}/status`, data),
  viewResume:     (id)          => api.get(`/applications/${id}/resume`),
  getStats:       ()            => api.get('/applications/employer/stats'),
}

// ── Resumes ────────────────────────────────────────────────────────────────
export const resumesAPI = {
  getMine:      ()          => api.get('/resumes/mine'),
  getOne:       (id)        => api.get(`/resumes/${id}`),
  create:       (data)      => api.post('/resumes', data),
  update:       (id, data)  => api.patch(`/resumes/${id}`, data),
  remove:       (id)        => api.delete(`/resumes/${id}`),
  uploadFile:   (id, form)  => api.post(`/resumes/${id}/files`, form),
  deleteFile:   (id, fid)   => api.delete(`/resumes/${id}/files/${fid}`),
  shareToken:   (id)        => api.post(`/resumes/${id}/share-token`),
  getShared:    (token)     => api.get(`/resumes/share/${token}`),
  search:       (params)    => api.get('/resumes/search', { params }),
}

// ── Companies ──────────────────────────────────────────────────────────────
export const companiesAPI = {
  getAll:      (params)   => api.get('/companies', { params }),
  getOne:      (id)       => api.get(`/companies/${id}`),
  getMe:       ()         => api.get('/companies/me'),
  create:      (data)     => api.post('/companies', data),
  update:      (data)     => api.patch('/companies/me', data),
  uploadLogo:  (form)     => api.post('/companies/me/logo', form),
  addGallery:  (form)     => api.post('/companies/me/gallery', form),
  removeGallery: (imgId)  => api.delete(`/companies/me/gallery/${imgId}`),
  follow:      (id)       => api.post(`/companies/${id}/follow`),
  verify:      (id, data) => api.patch(`/admin/companies/${id}/verify`, data),
}

// ── Messages ───────────────────────────────────────────────────────────────
export const messagesAPI = {
  getConversations: ()             => api.get('/messages/conversations'),
  startConversation: (data)        => api.post('/messages/conversations', data),
  getMessages:      (convId, p)   => api.get(`/messages/conversations/${convId}/messages`, { params: p }),
  send:             (convId, data) => api.post(`/messages/conversations/${convId}/messages`, data),
}

// ── Notifications ──────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:    (params) => api.get('/notifications', { params }),
  markRead:  (data)   => api.patch('/notifications/read', data),
  remove:    (id)     => api.delete(`/notifications/${id}`),
}

// ── Packages ───────────────────────────────────────────────────────────────
export const packagesAPI = {
  getAll:          ()     => api.get('/packages/all'),
  getMine:         ()     => api.get('/packages/mine'),
  getInvoices:     ()     => api.get('/packages/invoices'),
  razorpayOrder:   (data) => api.post('/packages/razorpay/order', data),
  razorpayVerify:  (data) => api.post('/packages/razorpay/verify', data),
  stripeOrder:     (data) => api.post('/packages/stripe/order', data),
}

// ── Lookup ─────────────────────────────────────────────────────────────────
export const lookupAPI = {
  categories:    () => api.get('/lookup/categories'),
  jobTypes:      () => api.get('/lookup/job-types'),
  careerLevels:  () => api.get('/lookup/career-levels'),
  education:     () => api.get('/lookup/education-levels'),
  currencies:    () => api.get('/lookup/currencies'),
  countries:     () => api.get('/lookup/countries'),
  states:        (cid) => api.get('/lookup/states', { params: { countryId: cid } }),
  cities:        (params) => api.get('/lookup/cities', { params }),
  search:        (q, type) => api.get('/lookup/search', { params: { q, type } }),
  tags:          () => api.get('/lookup/tags'),
}

// ── Admin ──────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:       ()            => api.get('/admin/stats'),
  getUsers:       (params)      => api.get('/admin/users', { params }),
  updateUser:     (id, data)    => api.patch(`/admin/users/${id}`, data),
  getJobs:        (params)      => api.get('/admin/jobs', { params }),
  verifyCompany:  (id, data)    => api.patch(`/admin/companies/${id}/verify`, data),
  getErrors:      ()            => api.get('/admin/errors'),
  getConfig:      ()            => api.get('/admin/config'),
  updateConfig:   (data)        => api.patch('/admin/config', data),
  getLogs:        (params)      => api.get('/admin/activity-logs', { params }),
}
