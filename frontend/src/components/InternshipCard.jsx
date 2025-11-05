import React from 'react'

function Stipend({min, max}){
  if(min == null && max == null) return <span>TBD</span>
  if(min != null && max != null) return <span>₹{min.toLocaleString()} - ₹{max.toLocaleString()}</span>
  if(min != null) return <span>From ₹{min.toLocaleString()}</span>
  return <span>Up to ₹{max.toLocaleString()}</span>
}

export default function InternshipCard({internship}){
  const {
    title, company, location, remote, stipendMin, stipendMax, skills, source, deadline
  } = internship

  return (
    <article className="card">
      <div className="card-left">
        <h3 className="card-title">{title}</h3>
        <div className="meta">{company} • {location} {remote ? '• Remote' : ''}</div>
        <div className="skills">{(skills || []).slice(0,5).map(s=> <span key={s} className="skill">{s}</span>)}</div>
      </div>
      <div className="card-right">
        <div className="stipend"><strong>Stipend:</strong> <Stipend min={stipendMin} max={stipendMax} /></div>
        <div className="source">{source}</div>
        <div className="deadline">Deadline: {deadline ? new Date(deadline).toLocaleDateString() : 'TBD'}</div>
      </div>
    </article>
  )
}
