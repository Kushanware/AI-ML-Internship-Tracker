import React from 'react'
import InternshipList from '../components/InternshipList'

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Browse internships</h2>
      <InternshipList />
    </div>
  )
}
