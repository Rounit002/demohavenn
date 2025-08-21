// src/pages/ManageBranches.tsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const ManageBranches: React.FC = () => {
  const [branches, setBranches] = useState<{ id: number; name: string; code?: string | null }[]>([]);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [editingBranch, setEditingBranch] = useState<{ id: number; name: string; code?: string | null } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { refreshUser } = useAuth();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        await refreshUser();
        const data = await api.getBranches();
        // getBranches now returns the array directly
        setBranches(data || []);
      } catch (error: any) {
        console.error('Failed to load branches:', error);
        toast.error(error.message || 'Could not fetch branches');
        setBranches([]);
      }
    };
    fetchBranches();
  }, [refreshUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await refreshUser();
      if (editingBranch) {
        const updated = await api.updateBranch(editingBranch.id, formData);
        setBranches(prev => prev.map(b => b.id === updated.id ? updated : b));
        setEditingBranch(null);
      } else {
        const created = await api.addBranch(formData);
        setBranches(prev => [...prev, created]);
        setFormData({ name: '', code: '' });
      }
      toast.success('Branch saved successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save branch');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await refreshUser();
      await api.deleteBranch(id);
      setBranches(prev => prev.filter(b => b.id !== id));
      toast.success('Branch deleted');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete branch');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} onBarcodeClick={() => {}} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Manage Branches</h1>

            {/* Create/Edit form */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Branch Name"
                  className="w-full sm:w-auto flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Branch Code"
                  className="w-full sm:w-auto flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingBranch ? 'Update' : 'Add'} Branch
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Code</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map(branch => (
                    <tr key={branch.id} className="border-t">
                      <td className="px-4 sm:px-6 py-3">{branch.name}</td>
                      <td className="px-4 sm:px-6 py-3 text-gray-600">{branch.code || '-'}</td>
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => setEditingBranch(branch)} className="text-blue-600 hover:text-blue-800">Edit</button>
                          <button onClick={() => handleDelete(branch.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBranches;