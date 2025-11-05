import React, {useEffect, useState} from 'react'
import InternshipCard from './InternshipCard'

export default function InternshipList(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    setLoading(true)
    fetch('http://localhost:5000/internships')
      .then(res=>{
        if(!res.ok) throw new Error('Network response not ok')
        return res.json()
      })
      .then(json=>{
        // backend returns {count, data}
        setItems(json.data || [])
        setLoading(false)
      })
      .catch(err=>{
        console.error('Failed to fetch internships', err)
        setError(err.message)
        setLoading(false)
      })
  },[])

  if(loading) return <div className="status">Loading internships…</div>
  if(error) return <div className="status error">Error: {error}</div>

  return (
    <section className="internship-list">
      {items.length === 0 && <div className="empty">No internships available.</div>}
      {items.map(item => (
        <InternshipCard key={item.id || item._id || item.sourceUrl} internship={item} />
      ))}
    </section>
  )
}
