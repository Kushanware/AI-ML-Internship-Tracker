import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import InternshipCard from './InternshipCard';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function InternshipList() {
  const queryClient = useQueryClient();
  const { isAuthenticated, token } = useAuth();
  
  // State for filters
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    remote: false,
    minStipend: '',
    skills: []
  });
  
  // State for sorting
  const [sortBy, setSortBy] = useState('postedAt');
  const [order, setOrder] = useState('desc');
  
  // Fetch internships
  const {
    data: internshipsData,
    isLoading: isLoadingInternships,
    error: internshipsError,
    refetch: refetchInternships
  } = useQuery(
    ['internships', filters, sortBy, order],
    async () => {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.location) params.append('location', filters.location);
      if (filters.remote) params.append('remote', 'true');
      if (filters.minStipend) params.append('minStipend', filters.minStipend);
      if (filters.skills.length > 0) params.append('skills', filters.skills.join(','));
      
      params.append('sortBy', sortBy);
      params.append('order', order);
      
      const { data } = await axios.get(`${API_URL}/internships?${params.toString()}`);
      return data;
    },
    {
      keepPreviousData: true
    }
  );
  
  // Fetch saved internships if authenticated
  const {
    data: savedData,
    isLoading: isLoadingSaved
  } = useQuery(
    ['saved-internships'],
    async () => {
      const { data } = await axios.get(`${API_URL}/internships/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return new Map(data.data.map(item => [
        String(item.internship._id),
        item.status
      ]));
    },
    {
      enabled: isAuthenticated,
      initialData: new Map()
    }
  );

  // Mutation for saving/updating internship status
  const saveStatusMutation = useMutation(
    async ({ internshipId, status }) => {
      await axios.post(
        `${API_URL}/internships/${internshipId}/save`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('saved-internships');
      }
    }
  );

  // Mutation for removing saved internship
  const removeSavedMutation = useMutation(
    async (internshipId) => {
      await axios.delete(
        `${API_URL}/internships/${internshipId}/save`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('saved-internships');
      }
    }
  );

  // Handle toggling saved status
  const handleToggleSave = async (internshipId) => {
    if (!isAuthenticated) {
      // TODO: Show login prompt
      return;
    }

    try {
      if (savedData.has(internshipId)) {
        await removeSavedMutation.mutateAsync(internshipId);
      } else {
        await saveStatusMutation.mutateAsync({
          internshipId,
          status: 'interested'
        });
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoadingInternships || isLoadingSaved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  if (internshipsError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load internships</div>
        <button
          onClick={() => refetchInternships()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search internships..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remote"
              checked={filters.remote}
              onChange={(e) => handleFilterChange('remote', e.target.checked)}
              className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
            />
            <label htmlFor="remote">Remote only</label>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <input
              type="number"
              placeholder="Min stipend"
              value={filters.minStipend}
              onChange={(e) => handleFilterChange('minStipend', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="postedAt">Posted Date</option>
              <option value="deadline">Deadline</option>
              <option value="stipendMin">Stipend</option>
            </select>
            
            <button
              onClick={() => setOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              {order === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {internshipsData?.data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No internships found matching your filters
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {internshipsData?.data.map((internship) => (
            <InternshipCard
              key={internship._id}
              internship={internship}
              savedStatus={savedData?.get(String(internship._id))}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}

      {/* Pagination placeholder */}
      {internshipsData?.pagination && (
        <div className="flex justify-center py-4">
          <div className="flex gap-2">
            {Array.from({ length: internshipsData.pagination.pages }, (_, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded ${
                  internshipsData.pagination.page === i + 1
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange('page', i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const handleSaveToggle = async (internshipId) => {
    if(!token){
      alert('Please log in to save internships')
      return
    }
    const isSaved = savedIds.has(internshipId)
    try {
      if(!isSaved){
        const res = await fetch('http://localhost:5000/users/me/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ internshipId })
        })
        if(res.ok){
          const json = await res.json()
          const map = new Map()
          (json.saved || []).forEach(entry => map.set(String(entry.internship), entry.status))
          setSavedIds(map)
        } else {
          throw new Error('Failed to save internship')
        }
      } else {
        const res = await fetch(`http://localhost:5000/users/me/save/${internshipId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        if(res.ok){
          const json = await res.json()
          const map = new Map()
          (json.saved || []).forEach(entry => map.set(String(entry.internship), entry.status))
          setSavedIds(map)
        } else {
          throw new Error('Failed to remove internship')
        }
      }
    } catch (err) {
      console.error('Failed to toggle save', err)
    }
  }

  useEffect(()=>{
    setLoading(true)
    fetch('http://localhost:5000/internships')
      .then(res=>{
        if(!res.ok) throw new Error('Network response not ok')
        return res.json()
      })
      .then(json=>{
        // backend returns {count, data}
        setItems(json.data || [])
        setLoading(false)
      })
      .catch(err=>{
        console.error('Failed to fetch internships', err)
        setError(err.message)
        setLoading(false)
      })
  },[])

  if(loading) return <div className="status">Loading internships…</div>
  if(error) return <div className="status error">Error: {error}</div>

  return (
    <section className="internship-list">
      {items.length === 0 && <div className="empty">No internships available.</div>}
      {items.map(item => {
        const id = item._id || item.id || item.sourceUrl
        const savedStatus = savedIds.get(String(id))
        return (
          <InternshipCard
            key={id}
            internship={item}
            savedStatus={savedStatus}
            onToggleSave={()=>handleSaveToggle(String(id))}
          />
        )
      })}
    </section>
  )
}
