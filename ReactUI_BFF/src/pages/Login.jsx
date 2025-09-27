import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { bffLogin } from '../api'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const nav = useNavigate()
  const loc = useLocation()
  const returnTo = new URLSearchParams(loc.search).get('returnTo') || '/students'

  async function onSubmit(e){
    e.preventDefault()
    try{
      setErr(null)
      await bffLogin(username, password)
      nav(returnTo)
    }catch(ex){
      setErr(ex.message || 'Login failed')
    }
  }

  return (
    <div style={{padding:20}}>
      <h2>Login</h2>
      {err && <div style={{color:'red'}}>{err}</div>}
      <form onSubmit={onSubmit}>
        <div>Username or Email<br/>
          <input value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div>Password<br/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button style={{marginTop:10}}>Login</button>
      </form>
    </div>
  )
}
