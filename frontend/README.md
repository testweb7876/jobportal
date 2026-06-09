# JobPortal Frontend

> React 18 + Vite + Redux Toolkit + Framer Motion + Recharts

---

## 🚀 Quick Start

```bash
# Install
npm install

# Setup env
cp .env.example .env
# Edit VITE_API_URL to point to your backend

# Run dev
npm run dev

# Build for production
npm run build
```

---

## 📁 Project Structure

```
src/
├── api/
│   └── index.js          # All API calls (axios) + interceptors
├── store/
│   └── index.js          # Redux store: auth, notifications, ui
├── hooks/
│   ├── index.js          # useDebounce, useLookup, usePagination, useClickOutside
│   └── useSocket.js      # Socket.io hook
├── styles/
│   └── global.css        # Design tokens + utility classes
├── components/
│   ├── common/index.jsx  # Button, Input, Modal, Badge, Avatar, Pagination...
│   ├── layout/index.jsx  # Navbar, Sidebar, DashboardLayout, TopHeader
│   ├── jobs/
│   │   ├── JobCard.jsx   # Job listing card
│   │   └── JobFilters.jsx# Filter sidebar
│   └── layout/ProtectedRoute.jsx
├── pages/
│   ├── public/index.jsx  # Home, Jobs, Job Detail, Companies
│   ├── auth/index.jsx    # Login, Register, Forgot/Reset Password, Verify Email
│   ├── jobseeker/        # Dashboard, Applications, Resumes, Packages, Notifications
│   ├── employer/         # Dashboard, Post Job, My Jobs, Applicants, Company, Resume Search
│   ├── admin/            # Dashboard, Users, Jobs
│   ├── chat/             # Real-time chat with Socket.io
│   ├── settings/         # Profile, Password, Notifications, Sessions
│   └── analytics/        # Employer job analytics
└── App.jsx               # Router + Provider setup
```

---

## 🎨 Design System

CSS variables in `global.css`:
- `--brand-*` — Blue brand palette
- `--gray-*`  — Neutral palette
- `--font-display` — Syne (headings)
- `--font-body`    — DM Sans (body)
- `--shadow-*`, `--radius-*` — Shadows & radii

Component classes: `.btn`, `.btn-primary`, `.btn-outline`, `.card`, `.badge`, `.form-input`, `.avatar`

---

## 🔐 Auth Flow

1. User registers/logs in → gets `accessToken` (15min) + `refreshToken` (7d)
2. Tokens stored in `localStorage`
3. Axios interceptor auto-refreshes when 401 received
4. Redux `auth` slice manages user state
5. `ProtectedRoute` enforces role-based access

---

## 🔌 Socket.io Events

Connected in `useSocket.js`:
- `notification`       — New notification
- `new_message`        — New chat message
- `user_typing`        — Typing indicator
- `user_stop_typing`   — Stop typing
- `user_online/offline`— Presence

---

## 📦 Key Pages

| Route | Page | Role |
|-------|------|------|
| `/` | Home + Featured Jobs | Public |
| `/jobs` | Job Search + Filters | Public |
| `/jobs/:id` | Job Detail + Apply | Public |
| `/companies` | Company Directory | Public |
| `/login` `/register` | Auth | Public |
| `/jobseeker` | Candidate Dashboard | Jobseeker |
| `/jobseeker/applications` | My Applications | Jobseeker |
| `/jobseeker/resume` | Manage Resumes | Jobseeker |
| `/employer` | Employer Dashboard | Employer |
| `/employer/jobs/new` | Post Job | Employer |
| `/employer/applications` | View Applicants | Employer |
| `/employer/company` | Company Profile | Employer |
| `/employer/analytics` | Job Analytics | Employer |
| `/admin` | Admin Dashboard | Admin |
| `/admin/users` | User Management | Admin |
| `/admin/jobs` | Job Moderation | Admin |

---

## 🌐 Deployment

**Vercel:**
```bash
npm run build
# Deploy dist/ to Vercel
# Set VITE_API_URL env var in Vercel dashboard
```

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```
