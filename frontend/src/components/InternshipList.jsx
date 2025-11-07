import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import InternshipCard from './InternshipCard'
import { useAuth } from '../context/AuthContext'

export default function InternshipList() {
  const [data, setData] = useState([])
  const [count, setCount] = useState(0)
  const [q, setQ] = useState('')
  const [location, setLocation] = useState('')
  const [remote, setRemote] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(false)
  const { token, user } = useAuth()

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/internships', { params: { q, location, remote, page, limit } })
      setData(res.data.data)
      setCount(res.data.count)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  async function handleSave(item) {
    if (!token || !user) return
    await api.post(`/users/${user.id}/save`, { internshipId: item._id })
    alert('Saved!')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." className="border px-3 py-2 rounded flex-1 min-w-[200px]" />
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="border px-3 py-2 rounded" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={remote} onChange={e=>setRemote(e.target.checked)} /> Remote</label>
        <button onClick={() => { setPage(1); load() }} className="px-4 py-2 rounded bg-blue-600 text-white">Apply</button>
      </div>
      {loading && <div>Loading...</div>}
      <div className="grid gap-4">
        {data.map(item => (
          <InternshipCard key={item._id} item={item} onSave={handleSave} canSave={!!token} />
        ))}
      </div>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>{count} results</div>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 border rounded disabled:opacity-50">Prev</button>
          <span>Page {page}</span>
          <button disabled={page*limit>=count} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  )
}
