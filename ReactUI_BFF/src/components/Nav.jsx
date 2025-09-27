import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bffLogout } from '../api'

export default function Nav(){
  const nav = useNavigate()
  return (
    <div style={{display:'flex', gap:12, padding:12, borderBottom:'1px solid #ddd'}}>
      <Link to="/">Home</Link>
      <Link to="/students">Students</Link>
      <Link to="/teachers">Teachers</Link>
      <a href="https://localhost:54451/swagger" target="_blank" rel="noreferrer">API Swagger</a>
      <div style={{marginLeft:'auto'}}>
        <button onClick={async()=>{ await bffLogout(); nav('/login') }}>Logout</button>
      </div>
    </div>
  )
}
