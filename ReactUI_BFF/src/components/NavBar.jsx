import { Link } from 'react-router-dom'
import { useAuth, useHasRole } from '../auth/AuthContext.jsx'
import { bffFetch } from '../lib/bffClient.js'

export default function NavBar() {
  const { ready, authed, name, roles } = useAuth()
  const isAdmin = useHasRole('AdminRole')

  const onLogout = async () => {
    try {
      await bffFetch('/bff/logout', { method: 'POST' })
      window.location.assign('/') // hard reload to reset state
    } catch (e) {
      alert('Logout failed: ' + e.message)
    }
  }

  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #ddd' }}>
      <Link to="/">Home</Link>
      {ready && authed && <Link to="/students">Students</Link>}
      {ready && authed && isAdmin && <Link to="/teachers">Teachers</Link>}
      <a href="/swagger" target="_blank" rel="noreferrer" style={{ marginLeft: 12 }}>API Swagger</a>

      <div style={{ marginLeft: 'auto' }}>
        {ready && authed ? (
          <>
            <span>Hello {name}{roles.length ? ` (${roles.join(',')})` : ''}</span>
            <button onClick={onLogout} style={{ marginLeft: 12 }}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  )
}
