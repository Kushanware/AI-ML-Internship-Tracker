import React from 'react'

export default function InternshipCard({ item, onSave, canSave }) {
  return (
    <div className="bg-white rounded border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="text-gray-700">{item.company}</p>
          <p className="text-sm text-gray-500">{item.location}{item.remote ? ' • Remote' : ''}</p>
        </div>
        {canSave && (
          <button onClick={() => onSave(item)} className="px-3 py-1.5 rounded bg-emerald-600 text-white">
            Save
          </button>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-700 line-clamp-3">{item.description}</div>
      <div className="mt-2 text-sm text-gray-500">Stipend: {item.stipendMin ?? '-'} - {item.stipendMax ?? '-'}</div>
      {item.sourceUrl && (
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-blue-600">View source</a>
      )}
    </div>
  )
}
