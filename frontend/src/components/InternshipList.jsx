import React, { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import InternshipCard from './InternshipCard'
import { useAuth } from '../context/AuthContext'
import { useToast } from './ToastProvider'

function Spinner() {
  return <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-transparent rounded-full" />
}

export default function InternshipList() {
  const [data, setData] = useState([])
  const [count, setCount] = useState(0)
  const [q, setQ] = useState('')
  const [location, setLocation] = useState('')
  const [remote, setRemote] = useState(false)
  const [minStipend, setMinStipend] = useState('')
  const [maxStipend, setMaxStipend] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [domain, setDomain] = useState('')
  const [source, setSource] = useState('')
  const [deadlineFrom, setDeadlineFrom] = useState('')
  const [deadlineTo, setDeadlineTo] = useState('')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState('')
  const [savedIds, setSavedIds] = useState(new Set())
  const [meta, setMeta] = useState({ sources: [], tags: [] })
  const [selectedTags, setSelectedTags] = useState([])
  const { token, user } = useAuth()
  const toast = useToast()

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/internships', { params: { q, location, remote, minStipend, maxStipend, domain, source, deadlineFrom, deadlineTo, tags: selectedTags.join(','), sort: sort==='newest'?undefined:(sort==='deadline'?'deadline_asc':(sort==='stipend'?'stipend_desc':'oldest')), page, limit } })
      setData(res.data.data)
      setCount(res.data.count)
      if (token && user) {
        const s = await api.get(`/users/${user.id}/saved`)
        setSavedIds(new Set(s.data.map(x => x.internship._id)))
      }
    } catch (e) {
      toast.error('Failed to load internships')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  useEffect(() => {
    (async () => {
      try {
        const m = await api.get('/internships/meta')
        setMeta(m.data)
      } catch {}
    })()
  }, [])

  // Debounced filter change
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, location, remote, minStipend, maxStipend, domain, source, deadlineFrom, deadlineTo, sort, selectedTags])

  async function handleSave(item) {
    if (!token || !user) { toast.info('Please login to save'); return }
    try {
      setSavingId(item._id)
      await api.post(`/users/${user.id}/save`, { internshipId: item._id })
      toast.success('Saved to your list')
      setSavedIds(prev => new Set([...prev, item._id]))
    } catch (e) {
      toast.error('Unable to save')
    } finally {
      setSavingId('')
    }
  }

  const rows = useMemo(() => data, [data])

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title/company..." className="border px-3 py-2 rounded flex-1 min-w-[200px]" />
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="border px-3 py-2 rounded" />
        <select value={domain} onChange={e=>setDomain(e.target.value)} className="border px-3 py-2 rounded">
          <option value="">All domains</option>
          <option>AI</option>
          <option>ML</option>
          <option>Data</option>
          <option>NLP</option>
        </select>
        <select value={source} onChange={e=>setSource(e.target.value)} className="border px-3 py-2 rounded">
          <option value="">All sources</option>
          {meta.sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={minStipend} onChange={e=>setMinStipend(e.target.value)} placeholder="Min stipend" className="border px-3 py-2 rounded w-32" />
        <input value={maxStipend} onChange={e=>setMaxStipend(e.target.value)} placeholder="Max stipend" className="border px-3 py-2 rounded w-32" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={remote} onChange={e=>setRemote(e.target.checked)} /> Remote</label>
        <input type="date" value={deadlineFrom} onChange={e=>setDeadlineFrom(e.target.value)} className="border px-3 py-2 rounded" />
        <input type="date" value={deadlineTo} onChange={e=>setDeadlineTo(e.target.value)} className="border px-3 py-2 rounded" />
        <select value={sort} onChange={e=>setSort(e.target.value)} className="border px-3 py-2 rounded">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="deadline">Deadline soon</option>
          <option value="stipend">Highest stipend</option>
        </select>
        <button onClick={() => { setQ(''); setLocation(''); setDomain(''); setSource(''); setDeadlineFrom(''); setDeadlineTo(''); setMinStipend(''); setMaxStipend(''); setRemote(false); setSort('newest'); setSelectedTags([]); setPage(1); load(); }} className="px-3 py-2 rounded border">Clear</button>
        <button onClick={() => { setPage(1); load() }} className="px-4 py-2 rounded bg-blue-600 text-white flex items-center gap-2">
          {loading && <Spinner />} Apply
        </button>
      </div>
      {/* Tag chips */}
      {meta.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {meta.tags.map(t => (
            <button key={t} onClick={() => setSelectedTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])} className={`px-2 py-1 rounded-full border text-xs ${selectedTags.includes(t)?'bg-blue-600 text-white border-blue-600':'bg-white'}`}>{t}</button>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_,i)=>(
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      )}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(item => (
          <InternshipCard key={item._id} item={item} onSave={handleSave} canSave={!!token} isSaved={savedIds.has(item._id)} saving={savingId===item._id} />
        ))}
      </div>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>{count} results</div>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 border rounded disabled:opacity-50">Prev</button>
          <span>Page {page}</span>
          <button disabled={page*limit>=count} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
      {!loading && rows.length===0 && (
        <div className="text-center text-gray-500 py-8">No internships match your filters.</div>
      )}
    </div>
  )
}
