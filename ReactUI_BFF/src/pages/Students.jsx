import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudents, createStudent, updateStudent, deleteStudent } from '../api'

function Row({s, onEdit, onDelete}){
  return (
    <tr>
      <td>{s.id}</td>
      <td>{s.stName}</td>
      <td>{s.stAddress}</td>
      <td>
        <button onClick={()=>onEdit(s)}>Edit</button>
        <button onClick={()=>onDelete(s.id)} style={{marginLeft:8}}>Delete</button>
      </td>
    </tr>
  )
}

export default function Students(){
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ id:0, stName:'', stAddress:'' })
  const [editing, setEditing] = useState(false)
  const [err, setErr] = useState(null)
  const nav = useNavigate()

  useEffect(()=>{
    (async()=>{
      try{ setList(await getStudents()) } catch(ex){ setErr(ex.message); nav('/login?returnTo=/students') }
    })()
  },[])

  const filtered = useMemo(()=>{
    const ql = q.trim().toLowerCase()
    if (!ql) return list
    return list.filter(x => (x.stName||'').toLowerCase().includes(ql))
  },[list,q])

  async function save(){
    try{
      if (editing){
        await updateStudent(form.id, { id: form.id, stName: form.stName, stAddress: form.stAddress })
      }else{
        const created = await createStudent({ stName: form.stName, stAddress: form.stAddress })
        setList(prev => [...prev, created])
      }
      setForm({ id:0, stName:'', stAddress:'' })
      setEditing(false)
      setList(await getStudents())
    }catch(ex){ setErr(ex.message) }
  }

  async function remove(id){
    try{
      await deleteStudent(id)
      setList(prev => prev.filter(x=>x.id!==id))
    }catch(ex){ setErr(ex.message) }
  }

  function startEdit(s){
    setForm({ id:s.id, stName:s.stName, stAddress:s.stAddress })
    setEditing(true)
  }

  return (
    <div style={{padding:20}}>
      <h2>Students</h2>
      {err && <div style={{color:'red'}}>{err}</div>}
      <div style={{margin:'10px 0'}}>
        <input placeholder="search name..." value={q} onChange={e=>setQ(e.target.value)} />
      </div>

      <table border="1" cellPadding="6">
        <thead><tr><th>Id</th><th>Name</th><th>Address</th><th>Actions</th></tr></thead>
        <tbody>
          {filtered.map(s => <Row key={s.id} s={s} onEdit={startEdit} onDelete={remove} />)}
        </tbody>
      </table>

      <h3 style={{marginTop:20}}>{editing?'Edit':'Add'} Student</h3>
      <div>
        <div>Name<br/><input value={form.stName} onChange={e=>setForm({...form, stName:e.target.value})} /></div>
        <div>Address<br/><input value={form.stAddress} onChange={e=>setForm({...form, stAddress:e.target.value})} /></div>
        <button onClick={save} style={{marginTop:8}}>{editing?'Save Student...':'Add Student..'}</button>
        {editing && <button onClick={()=>{ setEditing(false); setForm({ id:0, stName:'', stAddress:'' }) }} style={{marginLeft:8}}>Cancel</button>}
      </div>
    </div>
  )
}
