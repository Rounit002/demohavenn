import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AnnouncementList from '../components/AnnouncementList';
import AnnouncementForm from '../components/AnnouncementForm';

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

const Announcements: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);

  const handleAdd = () => {
    setEditingAnnouncement(undefined);
    setShowForm(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAnnouncement(undefined);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBarcodeClick = () => {
    setShowBarcodeGenerator(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          onBarcodeClick={handleBarcodeClick} 
        />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <AnnouncementList
              key={refreshTrigger}
              isAdmin={true}
              onEdit={handleEdit}
              onAdd={handleAdd}
            />
          </div>
        </main>
      </div>

      {/* Form Modal */}
      {showForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default Announcements;
