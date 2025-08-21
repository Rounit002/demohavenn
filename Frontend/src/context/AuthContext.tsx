import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import axios from 'axios';
import { authFetch } from '../utils/apiConfig';

interface User {
  id: string;
  username: string;
  role: string;
  permissions: string[];
  libraryId?: number; // For owners - their library ID
  libraryCode?: string; // For owners - their library code
  isOwner?: boolean; // Flag to identify owners
  is_trial?: boolean; // Subscription trial status
  subscription_end_date?: string; // Subscription end date
  subscription_plan?: string; // Current subscription plan
  is_subscription_active?: boolean; // Whether subscription is active
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; // ✅ NEW
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isLoading: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ NEW FUNCTION: Refresh user session via /auth/refresh
  const refreshUser = async () => {
    try {
      const response = await axios.get('/api/auth/refresh', { withCredentials: true });
      const refreshedUser = response.data?.user;
      if (refreshedUser) {
        refreshedUser.permissions = refreshedUser.permissions || [];
        setUser(refreshedUser);
        console.log('[AuthContext] Session refreshed:', refreshedUser);
      } else {
        console.warn('[AuthContext] No user data in refresh response');
        // Don't automatically logout - might be a temporary server issue
      }
    } catch (err: any) {
      console.error('[AuthContext] Failed to refresh session:', err);
      // Only logout on specific auth errors (401, 403), not network/server errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('[AuthContext] Authentication failed, logging out');
        setUser(null);
      }
      // For other errors (network, 500, etc.), keep user logged in
    }
  };

  useEffect(() => {
    const checkAuth = async (isInitialLoad: boolean) => {
      if (isInitialLoad) {
        setIsLoading(true);
      }
      try {
        // Check owner authentication first
        const ownerResponse = await authFetch('/owner-auth/status');
        if (ownerResponse.ok) {
          const ownerData = await ownerResponse.json();
          if (ownerData.isAuthenticated && ownerData.owner) {
            // Fetch subscription information for the owner
            let subscriptionInfo = {};
            try {
              const subscriptionResponse = await authFetch('/subscriptions/status');
              if (subscriptionResponse.ok) {
                const subscriptionData = await subscriptionResponse.json();
                subscriptionInfo = {
                  is_trial: subscriptionData.subscription.isTrial,
                  subscription_end_date: subscriptionData.subscription.endDate,
                  subscription_plan: subscriptionData.subscription.plan,
                  is_subscription_active: subscriptionData.subscription.isActive
                };
              }
            } catch (subscriptionError) {
              console.warn('[AuthContext] Failed to fetch subscription info:', subscriptionError);
            }
            
            const ownerAsUser = {
              id: ownerData.owner.id.toString(),
              username: ownerData.owner.ownerName,
              role: 'admin',
              permissions: [
                'view_dashboard', 'manage_students', 'manage_memberships',
                'view_reports', 'manage_seats', 'manage_shifts',
                'manage_hostel', 'manage_transactions', 'manage_expenses',
                'manage_products', 'manage_lockers_or_staff', 'manage_branches',
                'manage_users'
              ],
              libraryId: ownerData.owner.id,
              libraryCode: ownerData.owner.libraryCode,
              isOwner: true,
              ...subscriptionInfo
            };
            setUser(ownerAsUser);
            return;
          }
        }

        // If no owner, check for admin/staff
        const data = await api.checkAuthStatus();
        if (data && data.isAuthenticated && data.user) {
          const userWithPermissions = { ...data.user, permissions: data.user.permissions || [] };
          setUser(userWithPermissions);
          return;
        }

        // If no admin/staff, check for student
        const studentResponse = await authFetch('/student-auth/status');
        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          if (studentData.isAuthenticated && studentData.student) {
            const studentAsUser = {
              id: studentData.student.id.toString(),
              username: studentData.student.name,
              role: 'student',
              permissions: [],
              libraryId: studentData.student.library_id
            };
            setUser(studentAsUser);
            return;
          }
        }
        
        // If no one is logged in
        setUser(null);
      } catch (error) {
        console.error('Error during auth check:', error);
        setUser(null);
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
        }
      }
    };

    checkAuth(true); // Initial check with loading state
    const intervalId = setInterval(() => checkAuth(false), 30000); // Subsequent checks without loading state

    return () => clearInterval(intervalId);
  }, []);

  const login = (user: User) => {
    user.permissions = user.permissions || [];
    setUser(user);
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Check if current user is an owner
      if (user && user.isOwner) {
        // Owner logout
        await authFetch('/owner-auth/logout', {
          method: 'POST'
        });
      } else {
        // Admin/staff logout
        await api.logout();
      }
      setUser(null);
      // Redirect to landing page after logout
      window.location.href = '/#/'; 
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        logout,
        refreshUser, // ✅ Provide function to components
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
