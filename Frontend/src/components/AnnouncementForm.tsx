import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Save, Calendar, Globe, MapPin } from 'lucide-react';
import api from '../services/api';

interface Branch {
  id: number;
  name: string;
}

interface Announcement {
  id?: number;
  title: string;
  content: string;
  branch_id: number | null;
  is_global: boolean;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

interface AnnouncementFormProps {
  announcement?: Announcement;
  onClose: () => void;
  onSuccess: () => void;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  announcement,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<Announcement>({
    title: '',
    content: '',
    branch_id: null,
    is_global: false,
    start_date: null,
    end_date: null,
    is_active: true
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchBranches();
    if (announcement) {
      setFormData({
        ...announcement,
        start_date: announcement.start_date ? announcement.start_date.split('T')[0] : null,
        end_date: announcement.end_date ? announcement.end_date.split('T')[0] : null
      });
    }
  }, [announcement]);

  const fetchBranches = async () => {
    try {
      const response = await api.getBranches();
      setBranches(response);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to load branches');
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.is_global && !formData.branch_id) {
      newErrors.branch_id = 'Please select a branch or make it global';
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        branch_id: formData.is_global ? null : formData.branch_id
      };

      if (announcement?.id) {
        await api.updateAnnouncement(announcement.id, submitData);
        toast.success('Announcement updated successfully');
      } else {
        await api.createAnnouncement(submitData);
        toast.success('Announcement created successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      toast.error(error.response?.data?.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Announcement, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {announcement ? 'Edit Announcement' : 'Create New Announcement'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter announcement title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={6}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter announcement content"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          {/* Global vs Branch Specific */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Visibility
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.is_global}
                  onChange={() => {
                    handleChange('is_global', true);
                    handleChange('branch_id', null);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <Globe className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">Global (All branches)</span>
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  checked={!formData.is_global}
                  onChange={() => handleChange('is_global', false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">Branch specific</span>
                </div>
              </label>
            </div>
          </div>

          {/* Branch Selection */}
          {!formData.is_global && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Branch *
              </label>
              <select
                value={formData.branch_id || ''}
                onChange={(e) => handleChange('branch_id', e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.branch_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {errors.branch_id && (
                <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
              )}
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => handleChange('start_date', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => handleChange('end_date', e.target.value || null)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.end_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Inactive announcements will not be visible to students
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Announcement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementForm;
