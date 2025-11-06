import React from 'react';
import { CalendarIcon, MapPinIcon, CurrencyRupeeIcon, BookmarkIcon as BookmarkOutline } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

function Stipend({ min, max }) {
  if (min == null && max == null) {
    return <span className="text-gray-500">TBD</span>;
  }
  if (min != null && max != null) {
    return <span>₹{min.toLocaleString()} - ₹{max.toLocaleString()}</span>;
  }
  if (min != null) {
    return <span>From ₹{min.toLocaleString()}</span>;
  }
  return <span>Up to ₹{max.toLocaleString()}</span>;
}

function StatusBadge({ status }) {
  const colors = {
    interested: 'bg-blue-100 text-blue-800',
    applied: 'bg-yellow-100 text-yellow-800',
    selected: 'bg-green-100 text-green-800'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function InternshipCard({ internship, savedStatus, onToggleSave }) {
  const {
    title,
    company,
    location,
    remote,
    stipendMin,
    stipendMax,
    skills = [],
    source,
    deadline,
    sourceUrl
  } = internship;

  // Format meta information
  const metaParts = [];
  if (company) metaParts.push(company);
  if (location) metaParts.push(location);
  if (remote) metaParts.push('Remote');

  // Calculate days until deadline
  const daysUntilDeadline = deadline ? Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3;

  return (
    <article className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
              {sourceUrl ? (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600">
                  {title}
                </a>
              ) : title}
            </h3>
            
            <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500 mb-3">
              {company && (
                <span className="inline-flex items-center">
                  {company}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {location} {remote && '(Remote)'}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {skills.slice(0, 5).map(skill => (
                <span 
                  key={skill}
                  className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 5 && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  +{skills.length - 5} more
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="inline-flex items-center text-gray-700">
                <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                <Stipend min={stipendMin} max={stipendMax} />
              </div>
              
              {deadline && (
                <div className="inline-flex items-center text-gray-700">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span className={isUrgent ? 'text-red-600 font-medium' : ''}>
                    {isUrgent ? `${daysUntilDeadline} days left!` : new Date(deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {source && (
                <div className="text-gray-500 text-sm">
                  via {source}
                </div>
              )}
            </div>
          </div>

          <div className="ml-4 flex flex-col items-end">
            <button
              onClick={() => onToggleSave && onToggleSave(internship._id)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {savedStatus ? (
                <BookmarkSolid className="h-6 w-6 text-cyan-600" />
              ) : (
                <BookmarkOutline className="h-6 w-6 text-gray-400 hover:text-cyan-600" />
              )}
            </button>
            
            {savedStatus && (
              <StatusBadge status={savedStatus} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
