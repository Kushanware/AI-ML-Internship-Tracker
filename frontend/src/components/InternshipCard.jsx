import React from 'react'
import { BookmarkIcon, CheckBadgeIcon } from '@heroicons/react/24/solid'

export default function InternshipCard({ item, onSave, canSave, isSaved, saving }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 p-4 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold truncate" title={item.title}>{item.title}</h3>
          <p className="text-gray-700 truncate" title={item.company}>{item.company}</p>
          <p className="text-sm text-gray-500 truncate" title={item.location}>{item.location}{item.remote ? ' • Remote' : ''}</p>
        </div>
        {canSave && (
          isSaved ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-sm">
              <CheckBadgeIcon className="w-4 h-4" /> Saved
            </span>
          ) : (
            <button
              onClick={() => onSave?.(item)}
              disabled={saving}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white disabled:opacity-60"
              title="Save"
            >
              <BookmarkIcon className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
          )
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {(item.tags || []).slice(0,5).map((t,i)=> (
          <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">{t}</span>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-700 overflow-hidden max-h-24">{item.description}</div>
      <div className="mt-2 text-sm text-gray-500">Stipend: {item.stipendMin ?? '-'} - {item.stipendMax ?? '-'}{item.deadline ? ` • Deadline: ${new Date(item.deadline).toDateString()}` : ''}</div>
      <div className="mt-1 text-xs text-gray-500">Source: {item.source || '—'}</div>
      {item.sourceUrl && (
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-blue-600">View source</a>
      )}
    </div>
  )
}
