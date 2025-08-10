import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { Query } from '../services/api';
import { ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Approved': return 'bg-green-100 text-green-800';
    case 'Not Approved': return 'bg-red-100 text-red-800';
    case 'Done': return 'bg-blue-100 text-blue-800';
    case 'Not Done': return 'bg-orange-100 text-orange-800';
    case 'Posted':
    default: return 'bg-yellow-100 text-yellow-800';
  }
};

const AdminQueries: React.FC = () => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [sortType, setSortType] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchQueries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllQueriesForAdmin(); // Using a dedicated admin endpoint
      setQueries(data);
    } catch (err: any) {
      console.error('Error fetching queries:', err);
      setError(err.message || 'Failed to load queries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleStatusUpdate = async (queryId: number, status: string) => {
    const validStatuses = ['Approved', 'Not Approved', 'Done', 'Not Done', 'Posted'];
    if (!validStatuses.includes(status)) {
        console.error('Invalid status update:', status);
        setError('Invalid status selected.');
        return;
    }
    try {
      await api.updateQueryStatus(queryId, status as 'Posted' | 'Approved' | 'Not Approved' | 'Done' | 'Not Done');
      await fetchQueries(); // Refetch to show updated status
    } catch (err: any) {
      console.error('Error updating query status:', err);
      setError(err.message || 'Failed to update status.');
    }
  };
  
  const handleNavigate = (id: number) => {
    navigate(`/queries/${id}`);
  };

  const filteredAndSortedQueries = useMemo(() => {
    const filtered = queries.filter(q => filterStatus === 'All' || q.status === filterStatus);
    return filtered.sort((a, b) => {
      switch (sortType) {
        case 'upvotes': return (b.upvotes || 0) - (a.upvotes || 0);
        case 'status': return a.status.localeCompare(b.status);
        case 'newest':
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [queries, sortType, filterStatus]);

  if (loading) return <div className="text-center p-8">Loading queries...</div>;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Public Queries</h1>
          <p className="text-gray-600 mt-1">View, filter, and update the status of all student queries.</p>
        </div>

        <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div>
              <label htmlFor="filter" className="text-sm font-medium text-gray-700">Filter by status:</label>
              <select id="filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="mt-1 text-sm rounded-md border-gray-300 shadow-sm">
                <option value="All">All</option>
                <option value="Posted">Posted</option>
                <option value="Approved">Approved</option>
                <option value="Not Approved">Not Approved</option>
                <option value="Done">Done</option>
                <option value="Not Done">Not Done</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort" className="text-sm font-medium text-gray-700">Sort by:</label>
              <select id="sort" value={sortType} onChange={(e) => setSortType(e.target.value)} className="mt-1 text-sm rounded-md border-gray-300 shadow-sm">
                <option value="newest">Newest</option>
                <option value="upvotes">Most Upvoted</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        <div className="space-y-4">
          {filteredAndSortedQueries.map(query => (
            <div key={query.id} className="p-4 border rounded-lg shadow-sm bg-white transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-grow cursor-pointer" onClick={() => handleNavigate(query.id)}>
                  <h2 className="text-lg font-semibold text-gray-900 hover:text-indigo-600">{query.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">Posted by <span className="font-medium">{query.studentName}</span> on {new Date(query.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-medium mr-2 px-2.5 py-1 rounded-full ${getStatusBadge(query.status)}`}>{query.status}</span>
              </div>
              <p className="text-gray-600 mt-2 mb-4 text-sm">{query.description.substring(0, 150)}{query.description.length > 150 && '...'}</p>
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <div className="flex items-center space-x-4 text-gray-600">
                  <span className="flex items-center"><ThumbsUp className="w-4 h-4 mr-1 text-green-500" /> {query.upvotes || 0}</span>
                  <span className="flex items-center"><ThumbsDown className="w-4 h-4 mr-1 text-red-500" /> {query.downvotes || 0}</span>
                </div>
                <div className="relative inline-block text-left">
                  <select 
                    onChange={(e) => handleStatusUpdate(query.id, e.target.value)} 
                    value={query.status}
                    className="text-xs border-gray-300 rounded-md shadow-sm bg-white hover:border-gray-400 focus:ring-0 focus:border-gray-400"
                    onClick={(e) => e.stopPropagation()} // Prevent card click
                  >
                    <option>Posted</option>
                    <option>Approved</option>
                    <option>Not Approved</option>
                    <option>Done</option>
                    <option>Not Done</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredAndSortedQueries.length === 0 && !loading && (
            <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
                <p className="text-gray-600">No queries match the current filter.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminQueries;
