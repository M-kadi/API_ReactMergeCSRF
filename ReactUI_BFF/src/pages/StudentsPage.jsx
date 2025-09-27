import { useEffect, useState } from 'react'
import { bff } from '../lib/bffClient.js'
import { bffFetch } from "../lib/bffClient";

export default function StudentsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [form, setForm] = useState({ stName: '', stAddress: '' })

  const load = async () => {
    setLoading(true)
    try {
      const data = await bff('/bff/students')
      setItems(data)
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }



  useEffect(() => { load() }, [])

  async function addStudent(e) {
    e.preventDefault();
    const body = JSON.stringify({
      stName: form.name,       // <-- important
      stAddress: form.address  // <-- important
    });
    const r = await bffFetch("/bff/students", { method: "POST", body: form });
    if (!r.ok) setError("Failed to create student");
    else reload();
  }

  async function createStudent(stName, stAddress) {
    const r = await bffFetch('/bff/students', {
      method: 'POST',
      body: JSON.stringify({ stName, stAddress })
    });
    if (!r.ok) throw new Error(await r.text());
  }
  const add = async (e) => {
    e.preventDefault()
    try {
      await bff('/bff/students', { method: 'POST', body: form })
      setForm({ stName: '', stAddress: '' })
      await load()
    } catch (e2) { alert(e2.message) }
  }

  const del = async (id) => {
    if (!confirm('Delete?')) return
    try {
      await bff(`/bff/students/${id}`, { method: 'DELETE' })
      await load()
    } catch (e2) { alert(e2.message) }
  }

  return (
    <div>
      <h2>Students</h2>
      {loading && <div>Loading…</div>}
      {err && <div style={{ color: 'red' }}>{err}</div>}

      <form onSubmit={addStudent} style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input placeholder="Name" value={form.stName} onChange={e => setForm({ ...form, stName: e.target.value })} />
        <input placeholder="Address" value={form.stAddress} onChange={e => setForm({ ...form, stAddress: e.target.value })} />
        <button type="submit">Add Student</button>
      </form>

      <table border="1" cellPadding="6">
        <thead><tr><th>ID</th><th>Name</th><th>Address</th><th>Actions</th></tr></thead>
        <tbody>
          {items.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.stName}</td>
              <td>{s.stAddress}</td>
              <td>
                <button onClick={() => del(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {!items.length && !loading && <tr><td colSpan="4">No data</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
