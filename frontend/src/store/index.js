import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../api'

// ══════════════════════════════════════════════════════════════
// AUTH SLICE
// ══════════════════════════════════════════════════════════════
export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(data)
    return res.data
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Login failed')
  }
})

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data)
    return res.data
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Registration failed')
  }
})

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.getMe()
    return res.data.user
  } catch (e) {
    return rejectWithValue(e.response?.data?.message)
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const refreshToken = localStorage.getItem('refreshToken')
  try { await authAPI.logout({ refreshToken }) } catch {}
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    loading: false,
    initialized: false,
    error: null,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user
      state.accessToken = payload.accessToken
      localStorage.setItem('accessToken', payload.accessToken)
      if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken)
    },
    clearAuth: (state) => {
      state.user = null
      state.accessToken = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
    updateUser: (state, { payload }) => {
      state.user = { ...state.user, ...payload }
    },
  },
  extraReducers: (b) => {
    b
      .addCase(loginUser.pending,   (s) => { s.loading = true; s.error = null })
      .addCase(loginUser.fulfilled, (s, { payload }) => {
        s.loading = false
        s.user = payload.user
        s.accessToken = payload.accessToken
        localStorage.setItem('accessToken', payload.accessToken)
        if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken)
      })
      .addCase(loginUser.rejected,  (s, { payload }) => { s.loading = false; s.error = payload })

      .addCase(registerUser.pending,   (s) => { s.loading = true; s.error = null })
      .addCase(registerUser.fulfilled, (s, { payload }) => {
        s.loading = false
        s.user = payload.user
        s.accessToken = payload.accessToken
        localStorage.setItem('accessToken', payload.accessToken)
        if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken)
      })
      .addCase(registerUser.rejected,  (s, { payload }) => { s.loading = false; s.error = payload })

      .addCase(fetchMe.fulfilled, (s, { payload }) => {
        s.user = payload; s.initialized = true
      })
      .addCase(fetchMe.rejected, (s) => {
        s.initialized = true
        s.user = null
        s.accessToken = null
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      })

      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null; s.accessToken = null
      })
  },
})

export const { setCredentials, clearAuth, updateUser } = authSlice.actions

// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS SLICE
// ══════════════════════════════════════════════════════════════
const notifSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unread: 0 },
  reducers: {
    setNotifications: (s, { payload }) => {
      s.items = payload.notifications
      s.unread = payload.unreadCount
    },
    addNotification: (s, { payload }) => {
      s.items.unshift(payload)
      s.unread += 1
    },
    markAllRead: (s) => {
      s.items = s.items.map(n => ({ ...n, isRead: true }))
      s.unread = 0
    },
    decrementUnread: (s) => {
      if (s.unread > 0) s.unread -= 1
    },
  },
})

export const { setNotifications, addNotification, markAllRead, decrementUnread } = notifSlice.actions

// ══════════════════════════════════════════════════════════════
// UI SLICE
// ══════════════════════════════════════════════════════════════
const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: false, theme: 'light' },
  reducers: {
    toggleSidebar: (s) => { s.sidebarOpen = !s.sidebarOpen },
    closeSidebar:  (s) => { s.sidebarOpen = false },
    openSidebar:   (s) => { s.sidebarOpen = true },
  },
})

export const { toggleSidebar, closeSidebar, openSidebar } = uiSlice.actions

// ══════════════════════════════════════════════════════════════
// STORE
// ══════════════════════════════════════════════════════════════
export const store = configureStore({
  reducer: {
    auth:          authSlice.reducer,
    notifications: notifSlice.reducer,
    ui:            uiSlice.reducer,
  },
})

// Selectors
export const selectUser         = (s) => s.auth.user
export const selectToken        = (s) => s.auth.accessToken
export const selectAuthLoading  = (s) => s.auth.loading
export const selectInitialized  = (s) => s.auth.initialized
export const selectNotifs       = (s) => s.notifications.items
export const selectUnreadCount  = (s) => s.notifications.unread
export const selectSidebarOpen  = (s) => s.ui.sidebarOpen
