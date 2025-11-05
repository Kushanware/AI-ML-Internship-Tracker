import React, {useEffect, useState} from 'react'

export default function App(){
  const [health, setHealth] = useState(null)

  useEffect(()=>{
    fetch('http://localhost:5000/health')
      .then(r=>r.json())
      .then(setHealth)
      .catch(()=>setHealth({status: 'unreachable'}))
  },[])

  return (
    <div style={{fontFamily: 'Inter, system-ui, Arial', padding: 24}}>
      <h1>AI/ML Internship Tracker — Frontend Scaffold</h1>
      <p>Backend health: {health ? JSON.stringify(health) : 'loading...'}</p>
      <p>Next: implement Internship List, filters and user flows.</p>
    </div>
  )
}
