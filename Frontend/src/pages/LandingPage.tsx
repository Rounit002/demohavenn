import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BookOpen, Users, GraduationCap } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Library Management System</h1>
          </div>
          <p className="text-xl text-gray-600">Multi-tenant library management with attendance tracking</p>
        </div>

        {/* User Type Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8 max-w-2xl mx-auto">
          {/* Library Owner Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-blue-700">Library Owner / Staff</CardTitle>
              <CardDescription>
                Manage your library, students, attendance records, and staff operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => navigate('/owner-login')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Owner Login
              </Button>
              <Button 
                onClick={() => navigate('/owner-register')}
                variant="outline" 
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Register New Library
              </Button>
            </CardContent>
          </Card>

          {/* Student Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-300">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <GraduationCap className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-700">Student</CardTitle>
              <CardDescription>
                View your profile and mark attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => navigate('/student-login')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Student Login
              </Button>
              <div className="text-sm text-gray-500 text-center">
                Use your library code and phone number
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">System Features</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-700">For Library Owners & Staff:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Register and manage your library</li>
                <li>Add and manage students</li>
                <li>Track student attendance</li>
                <li>View detailed reports and statistics</li>
                <li>Staff operations and locker management</li>
                <li>Complete data isolation per library</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-green-700">For Students:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Login with library code and phone</li>
                <li>View personal profile and details</li>
                <li>Mark daily attendance</li>
                <li>View attendance history</li>
                <li>Secure access to own data only</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Multi-tenant library management system with secure data isolation</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
