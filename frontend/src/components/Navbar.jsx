import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ThemeToggle() {
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains('dark'))

  React.useEffect(() => {
    // Persisted preference takes precedence
    const pref = localStorage.getItem('theme')
    if (pref === 'dark') {
      document.documentElement.classList.add('dark'); setDark(true); return
    }
    if (pref === 'light') {
      document.documentElement.classList.remove('dark'); setDark(false); return
    }
    // Fallback to system preference
    const media = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
    const sys = media && media.matches
    document.documentElement.classList.toggle('dark', !!sys)
    setDark(!!sys)
    const listener = (e) => {
      // Only react when user didn't explicitly set a theme
      if (!localStorage.getItem('theme')) {
        document.documentElement.classList.toggle('dark', e.matches)
        setDark(e.matches)
      }
    }
    media && media.addEventListener && media.addEventListener('change', listener)
    return () => { media && media.removeEventListener && media.removeEventListener('change', listener) }
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button onClick={toggle} aria-pressed={dark} className="px-2 py-1.5 rounded border text-sm">
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const initials = user?.name?.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()
  return (
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg text-gray-900 dark:text-gray-100">AI/ML Internship Tracker</Link>
        <nav className="flex gap-4 items-center relative">
          <Link to="/" className="text-gray-700 hover:text-gray-900">Browse</Link>
          {token && <Link to="/saved" className="text-gray-700 hover:text-gray-900">Saved</Link>}
          <ThemeToggle />
          {!token ? (
            <>
              <Link to="/login" className="px-3 py-1.5 rounded bg-blue-600 text-white">Login</Link>
              <Link to="/signup" className="px-3 py-1.5 rounded border">Sign Up</Link>
            </>
          ) : (
            <div className="relative">
              <button onClick={()=>setOpen(o=>!o)} className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center select-none">
                <span className="text-sm font-semibold text-gray-700">{initials || 'U'}</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow">
                  <div className="px-3 py-2 text-sm text-gray-600">{user?.name}</div>
                  <Link onClick={()=>setOpen(false)} to="/settings" className="block px-3 py-2 hover:bg-gray-50">Settings</Link>
                  <Link onClick={()=>setOpen(false)} to="/saved" className="block px-3 py-2 hover:bg-gray-50">Saved</Link>
                  <button onClick={()=>{ setOpen(false); logout(); navigate('/'); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Logout</button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
