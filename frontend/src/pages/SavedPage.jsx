import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import InternshipCard from '../components/InternshipCard'

export default function SavedPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])

  async function load() {
    const res = await api.get(`/users/${user.id}/saved`)
    setItems(res.data)
  }

  useEffect(() => { if (user) load() }, [user])

  async function setStatus(internshipId, status) {
    await api.patch(`/users/${user.id}/status`, { internshipId, status })
    await load()
  }

  async function removeSaved(internshipId) {
    await api.delete(`/users/${user.id}/save/${internshipId}`)
    await load()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Saved internships</h2>
      <div className="grid gap-4">
        {items.map(s => (
          <div key={s.internship._id} className="space-y-2">
            <InternshipCard item={s.internship} canSave={false} />
            <div className="flex gap-2 text-sm">
              <span className="px-2 py-1 rounded bg-gray-100">Status: {s.status}</span>
              {['interested','applied','selected'].map(opt => (
                <button key={opt} onClick={() => setStatus(s.internship._id, opt)} className={`px-2 py-1 rounded border ${s.status===opt?'bg-blue-600 text-white':'bg-white'}`}>{opt}</button>
              ))}
              <button onClick={() => removeSaved(s.internship._id)} className="ml-auto px-2 py-1 rounded bg-red-600 text-white">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
