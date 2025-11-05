import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  interested: '#2563eb',
  applied: '#1d4ed8',
  selected: '#16a34a'
}

export default function DashboardPage(){
  const { user, token } = useAuth()
  const [data, setData] = useState({ saved: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    if(!token){
      setData({ saved: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    fetch('http://localhost:5000/users/me/saved', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch saved'))
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load saved internships')
        setLoading(false)
      })
  },[token])

  const counts = data.saved.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, { interested:0, applied:0, selected:0 })

  return (
    <section className="dashboard">
      <h2>Welcome back, {user?.name || user?.email}</h2>
      <div className="status-cards">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="status-card" style={{ borderColor: STATUS_COLORS[status] }}>
            <span className="label">{status}</span>
            <span className="count">{count}</span>
          </div>
        ))}
      </div>

      {loading && <p>Loading saved internships…</p>}
      {error && <p className="form-error">{error}</p>}

      <ul className="saved-list">
        {data.saved.map(item => (
          <li key={item.internship} className="saved-item">
            <div>
              <strong>{item.internshipDetails?.title || 'Internship'}</strong>
              <div className="subtle">{item.internshipDetails?.company}</div>
            </div>
            <span className="status-pill" style={{ backgroundColor: STATUS_COLORS[item.status] }}>{item.status}</span>
          </li>
        ))}
        {!loading && data.saved.length === 0 && <li className="empty">No saved internships yet.</li>}
      </ul>
    </section>
  )
}
