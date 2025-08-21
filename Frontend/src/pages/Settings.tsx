import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StaffManagement from '../components/StaffManagement';

// Define interfaces
interface UserData {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  role: string;
  permissions: string[];
}

interface UserProfile {
  user: UserData;
}

interface ProfileUpdateData {
  fullName: string | null;
  email: string | null;
}

interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

interface NewUserData {
  username: string;
  password: string;
  role: 'admin' | 'staff';
  permissions: string[];
}

interface SettingsData {
  brevoTemplateId: string;
  daysBeforeExpiration: number;
}

interface FormData {
  fullName: string;
  email: string;
  libraryName: string; // For owners
  ownerPhone: string; // For owners
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();



  const { data: profileData, isLoading, error } = useQuery<any>({
    queryKey: ['userProfile'],
    queryFn: () => (user?.isOwner ? api.getOwnerProfile() : api.getUserProfile()),
    enabled: !!user, // Fetch only when user is loaded
  });

  const { data: settings, isLoading: settingsLoading, error: settingsError } = useQuery<SettingsData>({
    queryKey: ['settings'],
    queryFn: api.getSettings,
    enabled: user?.role === 'admin',
  });

  const [formData, setFormData] = useState<FormData>({
    fullName: '', email: '', libraryName: '', ownerPhone: '', oldPassword: '', newPassword: '', confirmPassword: '',
  });

  const [settingsForm, setSettingsForm] = useState({
    brevoTemplateId: '', daysBeforeExpiration: '',
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const data = profileData?.owner || profileData?.user;
    if (data) {
      setFormData((prev) => ({
        ...prev,
        fullName: data.ownerName || data.fullName || '',
        email: data.ownerEmail || data.email || '',
        libraryName: data.libraryName || '',
        ownerPhone: data.ownerPhone || '',
      }));
    }
  }, [profileData]);

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        brevoTemplateId: settings.brevoTemplateId || '',
        daysBeforeExpiration: settings.daysBeforeExpiration?.toString() || '',
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };



  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.isOwner) {
      ownerProfileMutation.mutate({ 
        libraryName: formData.libraryName,
        ownerName: formData.fullName,
        ownerEmail: formData.email,
        ownerPhone: formData.ownerPhone,
      });
    } else {
      profileMutation.mutate({ fullName: formData.fullName, email: formData.email });
    }
  };

  const profileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) => api.updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update profile'),
  });

  const ownerProfileMutation = useMutation({
    mutationFn: (data: any) => api.updateOwnerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordUpdateData) => {
      if (user?.isOwner) {
        // Ensure the payload is correctly structured for the owner endpoint
        return api.changeOwnerPassword({ 
          currentPassword: data.currentPassword, 
          newPassword: data.newPassword 
        });
      } else {
        return api.changeUserPassword(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Password changed successfully!');
      setFormData((prev) => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
    },
    onError: (error: any) => toast.error(error.message || 'Failed to change password'),
  });



  const settingsMutation = useMutation({
    mutationFn: (data: { brevoTemplateId: string; daysBeforeExpiration: number }) => api.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully!');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update settings'),
  });

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.oldPassword || !formData.newPassword) {
      toast.error('Please fill current and new password fields');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    // Ensure we're using the correct field names that the API expects
    passwordMutation.mutate({ 
      currentPassword: formData.oldPassword, 
      newPassword: formData.newPassword 
    });
  };



  const handleSettingsUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const daysBeforeExpiration = parseInt(settingsForm.daysBeforeExpiration, 10);
    if (isNaN(daysBeforeExpiration) || daysBeforeExpiration <= 0) {
      toast.error('Days Before Expiration must be a positive number');
      return;
    }
    settingsMutation.mutate({ brevoTemplateId: settingsForm.brevoTemplateId, daysBeforeExpiration });
  };

  if (!user) return <div>Please log in to access settings.</div>;
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile: {error.message}</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <div
        className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-40 ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} onBarcodeClick={() => {}} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                <form onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user?.isOwner && (
                      <div className="md:col-span-2">
                        <label htmlFor="libraryName" className="block text-sm font-medium text-gray-700">Library Name</label>
                        <Input id="libraryName" name="libraryName" value={formData.libraryName} onChange={handleChange} />
                      </div>
                    )}
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">{user?.isOwner ? 'Owner Name' : 'Full Name'}</label>
                      <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                    </div>
                    {user?.isOwner && (
                      <div>
                        <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">Owner Phone</label>
                        <Input id="ownerPhone" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-right">
                    <Button type="submit" disabled={profileMutation.isPending || ownerProfileMutation.isPending}>
                      {profileMutation.isPending || ownerProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-xl font-semibold mb-4">Change Password</h3>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="oldPassword">Current Password</label>
                    <Input id="oldPassword" name="oldPassword" value={formData.oldPassword} onChange={handleChange} type="password"/>
                  </div>
                  <div>
                    <label htmlFor="newPassword">New Password</label>
                    <Input id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleChange} type="password"/>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <Input id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type="password"/>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Update Password</Button>
                  </div>
                </form>
              </div>
            </div>

            {user.role === 'admin' && (
              <div className="space-y-8">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-xl font-semibold mb-4">Email Settings</h3>
                  {settingsLoading ? <div>Loading...</div> : settingsError ? <div>Error...</div> : (
                    <form onSubmit={handleSettingsUpdate} className="space-y-4">
                      <div>
                        <label htmlFor="brevoTemplateId">Brevo Template ID</label>
                        <Input id="brevoTemplateId" name="brevoTemplateId" value={settingsForm.brevoTemplateId} onChange={handleSettingsChange}/>
                      </div>
                      <div>
                        <label htmlFor="daysBeforeExpiration">Remind Before Expiration (Days)</label>
                        <Input id="daysBeforeExpiration" name="daysBeforeExpiration" type="number" value={settingsForm.daysBeforeExpiration} onChange={handleSettingsChange}/>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit">Save Email Settings</Button>
                      </div>
                    </form>
                  )}
                </div>

                <StaffManagement />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
