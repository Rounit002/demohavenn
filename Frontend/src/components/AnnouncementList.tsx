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
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

interface Announcement {
  id: number;
  title: string;
  content: string;
  branch_id: number | null;
  is_global: boolean;
  start_date: string | null;
  end_date: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface AnnouncementListProps {
  isAdmin?: boolean;
  branchId?: number;
  onEdit?: (announcement: Announcement) => void;
  onAdd?: () => void;
}

const AnnouncementList: React.FC<AnnouncementListProps> = ({ 
  isAdmin = false, 
  branchId,
  onEdit,
  onAdd 
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = branchId && !isAdmin ? { branch_id: branchId } : {};
      const response = await api.getAnnouncements(params);
      setAnnouncements(response);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await api.deleteAnnouncement(id);
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [branchId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Megaphone className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {isAdmin ? 'Manage Announcements' : 'Announcements'}
          </h2>
        </div>
        {isAdmin && onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
          <p className="text-gray-500">
            {isAdmin ? 'Create your first announcement to get started.' : 'No announcements available at the moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  {announcement.title}
                </h3>
                {isAdmin && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => onEdit && onEdit(announcement)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit announcement"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete announcement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="text-gray-700 mb-4 whitespace-pre-wrap">
                {announcement.content}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>By {announcement.created_by_name}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(announcement.created_at)}</span>
                </div>

                <div className="flex items-center space-x-1">
                  {announcement.is_global ? (
                    <>
                      <Globe className="h-4 w-4" />
                      <span>Global</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      <span>Branch Specific</span>
                    </>
                  )}
                </div>

                {(announcement.start_date || announcement.end_date) && (
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {announcement.start_date && `From ${formatDate(announcement.start_date)}`}
                      {announcement.start_date && announcement.end_date && ' '}
                      {announcement.end_date && `Until ${formatDate(announcement.end_date)}`}
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
