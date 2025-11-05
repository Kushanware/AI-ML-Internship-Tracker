import React from 'react'
import InternshipList from './components/InternshipList'

export default function App(){
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>AI/ML Internship Tracker</h1>
        <p className="subtitle">Find and track AI/ML internships in one dashboard</p>
      </header>

      <main className="app-main">
        <InternshipList />
      </main>

      <footer className="app-footer">
        <small>Prototype — data comes from the backend `/internships` endpoint.</small>
      </footer>
    </div>
  )
}
