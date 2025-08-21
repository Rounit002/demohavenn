import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Megaphone, 
  Edit, 
  Trash2, 
  Plus, 
  Calendar, 
  User, 
  Globe,
  MapPin,
  AlertCircle,
  Clock
} from 'lucide-react';
import api from '../services/api';

// --- Type Definitions ---
interface Announcement {
  id: number;
  title: string;
  content: string;
  branchId: number | null;
  branchName?: string | null;
  isGlobal: boolean;
  startDate: string | null;
  endDate: string | null;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface AnnouncementListProps {
  isAdmin?: boolean;
  branchId?: number;
  onEdit?: (announcement: Announcement) => void;
  onAdd?: () => void;
}

// --- Helper Components ---

// A more visually appealing loading spinner
const LoadingSpinner = () => (
  <div className="flex justify-center items-center w-full h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

// An enhanced empty state message
const EmptyState = ({ isAdmin, onAdd }: { isAdmin?: boolean; onAdd?: () => void; }) => (
  <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-12 mt-6">
    <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Announcements Yet</h3>
    <p className="text-gray-500 max-w-md mx-auto">
      {isAdmin 
        ? "It's a bit quiet in here. Click 'New Announcement' to share updates with everyone." 
        : 'There are currently no announcements to display. Please check back later.'}
    </p>
    {isAdmin && onAdd && (
      <button
        onClick={onAdd}
        className="mt-6 flex items-center mx-auto space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <Plus className="h-5 w-5" />
        <span>Create First Announcement</span>
      </button>
    )}
  </div>
);

// --- Main Component ---

const AnnouncementList: React.FC<AnnouncementListProps> = ({ 
  isAdmin = false, 
  branchId,
  onEdit,
  onAdd 
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // --- Data Fetching ---
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = branchId && !isAdmin ? { branch_id: branchId } : {};
      const response = await api.getAnnouncements(params);
      // Normalize keys and provide safe defaults
      const normalized: Announcement[] = response.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        branchId: a.branchId ?? a.branch_id ?? null,
        branchName: a.branchName ?? a.branch_name ?? null,
        isGlobal: a.isGlobal ?? a.is_global ?? false,
        startDate: a.startDate ?? a.start_date ?? null,
        endDate: a.endDate ?? a.end_date ?? null,
        createdBy: a.createdBy ?? a.created_by ?? 0,
        createdByName: a.createdByName ?? a.created_by_name ?? '',
        createdAt: a.createdAt ?? a.created_at ?? new Date().toISOString(),
        updatedAt: a.updatedAt ?? a.updated_at ?? new Date().toISOString(),
        // Default to true if server omits isActive
        isActive: (a.isActive ?? a.is_active)
        	// if undefined or null, treat as true on admin side so new items don't appear inactive
            ?? true,
      }));
      // Sort announcements by creation date, newest first
      setAnnouncements(normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- API Calls ---
  const handleDelete = async (id: number) => {
    setDeletingId(id); // Show loading state on the button
    try {
      await api.deleteAnnouncement(id);
      toast.success('Announcement deleted successfully');
      // Refresh list by removing the deleted item instantly for better UX
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [branchId]); // Dependency array ensures this runs when branchId changes

  // --- Utility Functions ---
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // --- Render Logic ---
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isAdmin ? 'Manage Announcements' : 'Latest Updates'}
          </h1>
          <p className="mt-1 text-md text-gray-500">
            View, create, and manage all company-wide and branch-specific announcements.
          </p>
        </div>
        {isAdmin && onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:block">New Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements List or Empty State */}
      {announcements.length === 0 ? (
        <EmptyState isAdmin={isAdmin} onAdd={onAdd} />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white border rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden ${
                !ann.isActive ? 'opacity-60 bg-gray-50' : 'border-gray-200'
              }`}
            >
              {/* Card Header with Status and Actions */}
              <div className="p-5 border-b border-gray-200 flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {ann.title}
                  </h3>
                  {!ann.isActive && (
                    <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full mt-2 inline-block">
                      Inactive
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex space-x-1 flex-shrink-0">
                    <button
                      onClick={() => onEdit && onEdit(ann)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Edit announcement"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      disabled={deletingId === ann.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Delete announcement"
                    >
                       {deletingId === ann.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-5 text-gray-600 text-base leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </div>

              {/* Card Footer with Metadata */}
              <div className="px-5 py-4 bg-gray-50/70 border-t border-gray-200 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500">
                <div className="flex items-center space-x-2" title="Author">
                  <User className="h-4 w-4" />
                  <span>{ann.createdByName}</span>
                </div>
                <div className="flex items-center space-x-2" title={`Published on ${formatDate(ann.createdAt)}`}>
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(ann.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-2" title={ann.isGlobal ? "Global Announcement" : `Branch: ${ann.branchName || 'Unknown'}` }>
                  {ann.isGlobal ? <Globe className="h-4 w-4 text-blue-500" /> : <MapPin className="h-4 w-4 text-green-500" />}
                  <span>
                    {ann.isGlobal ? 'Global' : (ann.branchName ? `Branch: ${ann.branchName}` : 'Branch Specific')}
                  </span>
                </div>
                {(ann.startDate || ann.endDate) && (
                  <div className="flex items-center space-x-2" title="Active Dates">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>
                      {formatDate(ann.startDate)} - {formatDate(ann.endDate) || 'Ongoing'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementList;