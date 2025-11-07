import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function validate() {
    if (!name.trim()) return 'Name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email'
    if (password.length < 6) return 'Password must be at least 6 characters'
    return ''
  }

  async function onSubmit(e) {
    e.preventDefault()
    const v = validate()
    if (v) { setError(v); return }
    setError('')
    try {
      await signup(name, email, password)
      navigate('/')
    } catch (e) {
      setError('Sign up failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded border">
      <h2 className="text-xl font-semibold mb-4">Sign Up</h2>
      {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
      <form className="space-y-3" onSubmit={onSubmit}>
        <input className="w-full border px-3 py-2 rounded" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full border px-3 py-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border px-3 py-2 rounded" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full py-2 rounded bg-blue-600 text-white">Create account</button>
      </form>
      <p className="text-sm mt-3">Already have an account? <Link to="/login" className="text-blue-600">Login</Link></p>
    </div>
  )
}
