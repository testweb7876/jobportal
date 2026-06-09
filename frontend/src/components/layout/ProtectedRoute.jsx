import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectUser, selectInitialized } from '../../store'
import { Spinner } from '../../components/common'

const ProtectedRoute = ({ children, roles }) => {
  const user = useSelector(selectUser)
  const initialized = useSelector(selectInitialized)
  const location = useLocation()

  if (!initialized) {
    return (
      <div className="page-loader">
        <Spinner size={36} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    const dashMap = { jobseeker: '/jobseeker', employer: '/employer', admin: '/admin' }
    return <Navigate to={dashMap[user.role] || '/'} replace />
  }

  return children
}

export default ProtectedRoute
