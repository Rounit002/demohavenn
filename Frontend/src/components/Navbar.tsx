
import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Calculate days left in trial
  const calculateDaysLeft = () => {
    if (user?.subscription_end_date) {
      const endDate = new Date(user.subscription_end_date);
      const currentDate = new Date();
      const timeDiff = endDate.getTime() - currentDate.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return days > 0 ? days : 0;
    }
    return null;
  };

  const daysLeft = calculateDaysLeft();

  // Get subscription plan display name
  const getSubscriptionPlanName = () => {
    if (!user?.subscription_plan) return 'No Plan';
    
    const planNames: Record<string, string> = {
      'free_trial': 'Free Trial',
      '1_month': 'Monthly Plan',
      '3_month': 'Quarterly Plan',
      '6_month': 'Half-Yearly Plan',
      '9_month': 'Nine-Month Plan',
      '12_month': 'Annual Plan'
    };
    
    return planNames[user.subscription_plan] || user.subscription_plan;
  };

  const subscriptionPlanName = getSubscriptionPlanName();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Subscription status banner */}
      {user?.is_trial && daysLeft !== null && daysLeft > 0 && (
        <div className="bg-green-100 border-b border-green-400 text-green-700 px-4 py-2 text-center text-sm font-medium">
          🟢 {subscriptionPlanName} Active – {daysLeft} Days Left
        </div>
      )}
      {user?.is_subscription_active && !user?.is_trial && (
        <div className="bg-blue-100 border-b border-blue-400 text-blue-700 px-4 py-2 text-center text-sm font-medium">
          🔵 {subscriptionPlanName} Active
        </div>
      )}
      {!user?.is_subscription_active && !user?.is_trial && user?.role === 'admin' && (
        <div className="bg-yellow-100 border-b border-yellow-400 text-yellow-700 px-4 py-2 text-center text-sm font-medium">
          ⚠️ No Active Subscription – <a href="/subscription-plans" className="underline font-bold">Subscribe Now</a>
        </div>
      )}
      <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
            />
          </div>
        </div>
      
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-purple-600 flex items-center justify-center text-white">
              {user && user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.username || 'User'}</p>
              <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-purple-600">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
