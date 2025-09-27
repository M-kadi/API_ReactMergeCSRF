import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { bff } from '../lib/bffClient.js'
import { ensureCsrf } from '../lib/bffClient.js'

export default function LoginPage() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Admin123!')
  const [error, setError] = useState(null)
  const loc = useLocation()
  const nav = useNavigate()
  const params = new URLSearchParams(loc.search)
  const returnTo = params.get('returnTo') || '/'

  useEffect(() => { setError(null) }, [username, password])

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      await bff('/bff/login', { method: 'POST', body: { username, password } })
      await ensureCsrf();
      nav(returnTo, { replace: true })
      window.location.reload() // ensure whoami refresh
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ maxWidth: 360 }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit">Login</button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </form>
      <p style={{ marginTop: 12, color: '#666' }}>
        Try <code>admin/Admin123!</code> or <code>student/Student123!</code>
      </p>
    </div>
  )
}
