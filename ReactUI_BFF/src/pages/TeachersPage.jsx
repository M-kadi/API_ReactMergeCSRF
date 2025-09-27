import { useEffect, useState } from 'react'
import { bff } from '../lib/bffClient.js'

export default function TeachersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [form, setForm] = useState({ name: '', address: '' })

  const load = async () => {
    setLoading(true)
    try {
      const data = await bff('/bff/teachers')
      setItems(data)
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    try {
      await bff('/bff/teachers', { method: 'POST', body: form })
      setForm({ name: '', address: '' })
      await load()
    } catch (e2) { alert(e2.message) }
  }

  const del = async (id) => {
    if (!confirm('Delete?')) return
    try {
      await bff(`/bff/teachers/${id}`, { method: 'DELETE' })
      await load()
    } catch (e2) { alert(e2.message) }
  }

  return (
    <div>
      <h2>Teachers (Admin only)</h2>
      {loading && <div>Loading…</div>}
      {err && <div style={{ color: 'red' }}>{err}</div>}

      <form onSubmit={add} style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <button type="submit">Add</button>
      </form>

      <table border="1" cellPadding="6">
        <thead><tr><th>ID</th><th>Name</th><th>Address</th><th>Actions</th></tr></thead>
        <tbody>
          {items.map(t => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.name}</td>
              <td>{t.address}</td>
              <td>
                <button onClick={() => del(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {!items.length && !loading && <tr><td colSpan="4">No data</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
