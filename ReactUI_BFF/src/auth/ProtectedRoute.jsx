import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, useHasRole } from './AuthContext.jsx'

export default function ProtectedRoute({ children, requiredRole }) {
  const { ready, authed } = useAuth()
  const has = useHasRole(requiredRole ?? '')
  const loc = useLocation()

  if (!ready) return <div>Loading…</div>
  if (!authed) return <Navigate to={`/login?returnTo=${encodeURIComponent(loc.pathname)}`} replace />
  if (requiredRole && !has) return <div>Forbidden (missing role: {requiredRole})</div>

  return children
}
