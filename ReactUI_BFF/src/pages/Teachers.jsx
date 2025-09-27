import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../api'

export default function Teachers(){
  const [list, setList] = useState([])
  const [form, setForm] = useState({ id:0, name:'', address:'' })
  const [editing, setEditing] = useState(false)
  const [err, setErr] = useState(null)
  const nav = useNavigate()

  useEffect(()=>{
    (async()=>{
      try{ setList(await getTeachers()) } catch(ex){ setErr(ex.message); nav('/login?returnTo=/teachers') }
    })()
  },[])

  async function save(){
    try{
      if (editing){
        await updateTeacher(form.id, { id: form.id, name: form.name, address: form.address })
      } else {
        const created = await createTeacher({ name: form.name, address: form.address })
        setList(prev => [...prev, created])
      }
      setForm({ id:0, name:'', address:'' })
      setEditing(false)
      setList(await getTeachers())
    }catch(ex){ setErr(ex.message) }
  }

  async function remove(id){
    try{
      await deleteTeacher(id)
      setList(prev => prev.filter(x=>x.id!==id))
    }catch(ex){ setErr(ex.message) }
  }

  function startEdit(t){
    setForm({ id:t.id, name:t.name, address:t.address })
    setEditing(true)
  }

  return (
    <div style={{padding:20}}>
      <h2>Teachers (Admin only)</h2>
      {err && <div style={{color:'red'}}>{err}</div>}

      <table border="1" cellPadding="6">
        <thead><tr><th>Id</th><th>Name</th><th>Address</th><th>Actions</th></tr></thead>
        <tbody>
          {list.map(t => (
            <tr key={t.id}>
              <td>{t.id}</td><td>{t.name}</td><td>{t.address}</td>
              <td>
                <button onClick={()=>startEdit(t)}>Edit</button>
                <button onClick={()=>remove(t.id)} style={{marginLeft:8}}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{marginTop:20}}>{editing?'Edit':'Add'} Teacher</h3>
      <div>
        <div>Name<br/><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
        <div>Address<br/><input value={form.address} onChange={e=>setForm({...form, address:e.target.value})} /></div>
        <button onClick={save} style={{marginTop:8}}>{editing?'Save':'Add'}</button>
        {editing && <button onClick={()=>{ setEditing(false); setForm({ id:0, name:'', address:'' }) }} style={{marginLeft:8}}>Cancel</button>}
      </div>
    </div>
  )
}
