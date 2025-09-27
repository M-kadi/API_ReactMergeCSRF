import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav'
import Login from './pages/Login'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
//import { ensureCsrf } from './lib/bffClient';
import { useEffect } from 'react';
import { ensureCsrf } from './api';

export default function App(){
  useEffect(() => { ensureCsrf().catch(console.error); }, []);

  return (
    <div>
      <Nav />
      <div style={{padding:20}}>
        <Routes>
          <Route path="/" element={<p>Welcome. Use the nav to Login, view Students/Teachers.</p>} />
          <Route path="/login" element={<Login />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}
