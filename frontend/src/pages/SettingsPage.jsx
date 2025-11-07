import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function SettingsPage() {
  const { user } = useAuth()
  const [emailReminders, setEmailReminders] = useState(true)
  const [domains, setDomains] = useState('')
  const [locations, setLocations] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await api.get(`/users/${user.id}`)
      const pref = res.data.preferences || {}
      setEmailReminders(pref.emailReminders !== false)
      setDomains((pref.domains || []).join(', '))
      setLocations((pref.locations || []).join(', '))
    }
    if (user) load()
  }, [user])

  async function save() {
    setLoading(true)
    try {
      await api.patch(`/users/${user.id}/preferences`, {
        emailReminders,
        domains: domains.split(',').map(s=>s.trim()).filter(Boolean),
        locations: locations.split(',').map(s=>s.trim()).filter(Boolean),
      })
      alert('Preferences saved')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={emailReminders} onChange={e=>setEmailReminders(e.target.checked)} />
          Email reminders
        </label>
        <label className="block text-sm">Preferred domains (comma separated)</label>
        <input className="w-full border px-3 py-2 rounded" value={domains} onChange={e=>setDomains(e.target.value)} placeholder="AI, ML, Data Science" />
        <label className="block text-sm">Preferred locations (comma separated)</label>
        <input className="w-full border px-3 py-2 rounded" value={locations} onChange={e=>setLocations(e.target.value)} placeholder="Remote, Bengaluru" />
      </div>
      <button onClick={save} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Save</button>
    </div>
  )
}
