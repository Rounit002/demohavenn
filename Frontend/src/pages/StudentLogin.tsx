import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authFetch } from '../utils/apiConfig';
import { Eye, EyeOff, GraduationCap, Code, Phone, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StudentLoginData {
  libraryCode: string;
  phone: string;
  password: string;
}

const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<StudentLoginData>({
    libraryCode: '',
    phone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'libraryCode' ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.libraryCode || !formData.phone || !formData.password) {
      toast.error('All fields are required');
      return;
    }

    if (formData.phone.length !== 10 || !/^\d+$/.test(formData.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authFetch("/student-auth/login", {
        method: "POST",
        body: JSON.stringify({
          libraryCode: formData.libraryCode,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Welcome, ${data.student.name}!`);
        navigate('/student-dashboard');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Student login error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Student Login</h1>
          <p className="text-gray-600 mt-2">Access your library account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Library Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Library Code
            </label>
            <div className="relative">
              <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="libraryCode"
                value={formData.libraryCode}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                placeholder="Enter library code"
                maxLength={20}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ask your library for the library code
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your phone number"
                maxLength={10}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your password is the same as your phone number
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account? Contact your library to get registered.
          </p>
        </div>

        <div className="mt-4 text-center space-y-2">
          <Link to="/owner-login" className="block text-sm text-gray-500 hover:text-gray-700">
            Library Owner Login →
          </Link>
          <Link to="/login" className="block text-sm text-gray-500 hover:text-gray-700">
            ← Admin/Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
