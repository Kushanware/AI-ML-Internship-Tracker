import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function SettingsPage() {
  const { user } = useAuth()
  const [emailReminders, setEmailReminders] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      // reuse saved fetch to get preferences quickly
      const res = await api.get(`/users/${user.id}/saved`)
      // server doesn’t return preferences here; optimistically keep local until we fetch user profile endpoint in future
    }
    if (user) load()
  }, [user])

  async function save() {
    setLoading(true)
    try {
      await api.patch(`/users/${user.id}/preferences`, { emailReminders })
      alert('Preferences saved')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={emailReminders} onChange={e=>setEmailReminders(e.target.checked)} />
        Email reminders
      </label>
      <button onClick={save} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Save</button>
    </div>
  )
}
