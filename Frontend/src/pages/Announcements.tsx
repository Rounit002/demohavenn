import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AnnouncementList from '../components/AnnouncementList';
import AnnouncementForm from '../components/AnnouncementForm';
import { useIsMobile } from '../hooks/use-mobile';
import ResponsiveContainer from '../components/ResponsiveContainer';
import MobileNav from '../components/MobileNav';

// Match the camelCase Announcement shape used by list and form
interface Announcement {
  id: number;
  title: string;
  content: string;
  branchId: number | null;
  isGlobal: boolean;
  startDate: string | null;
  endDate: string | null;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

const Announcements: React.FC = () => {
  const isMobile = useIsMobile();
  // State to manage the visibility of the form (for adding/editing)
  const [isFormOpen, setIsFormOpen] = useState(false);
  // State to hold the announcement being edited, if any
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>();
  // A simple and effective trigger to force the list to refetch data after a change
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dummy state for sidebar - assuming these exist from your original setup
  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- Event Handlers ---

  // Opens the form to add a new announcement
  const handleAdd = () => {
    setEditingAnnouncement(undefined); // Ensure we're not editing
    setIsFormOpen(true);
  };

  // Opens the form to edit an existing announcement
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsFormOpen(true);
  };

  // Closes the form and resets the editing state
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAnnouncement(undefined);
  };

  // Called on successful form submission to trigger a data refresh in the list
  const handleFormSuccess = () => {
    handleFormClose(); // Close the form first
    setRefreshTrigger(prev => prev + 1); // Then trigger the refresh
  };

  if (isMobile) {
    // Mobile-optimized layout (no sidebar, compact header, bottom nav)
    return (
      <ResponsiveContainer withBottomNav>
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-base font-semibold">Announcements</h1>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white active:scale-[0.98]"
          >
            New
          </button>
        </header>
        <main className="p-4 pb-24">
          <AnnouncementList
            key={refreshTrigger}
            isAdmin={true}
            onEdit={handleEdit}
            onAdd={handleAdd}
          />
        </main>
        <MobileNav />
        {isFormOpen && (
          <AnnouncementForm
            announcement={editingAnnouncement}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </ResponsiveContainer>
    );
  }

  // Desktop layout remains unchanged
  return (
    <div className="flex h-screen bg-gray-50/50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex flex-col flex-1">
        <Navbar />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <AnnouncementList
              key={refreshTrigger}
              isAdmin={true}
              onEdit={handleEdit}
              onAdd={handleAdd}
            />
          </div>
        </main>
      </div>

      {isFormOpen && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
;

export default Announcements;