import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight, Users, UserCheck, AlertTriangle, DollarSign, TrendingUp, TrendingDown, Home, QrCode, Calendar, Clock, Search, Download, Printer, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import StudentList from '../components/StudentList';
import AddStudentForm from '../components/AddStudentForm';
import ExpiringMemberships from '../components/ExpiringMemberships';
import BarcodeGenerator from '../components/BarcodeGenerator';
import RegistrationLinkCard from '../components/RegistrationLinkCard';
import api, { AttendanceRecord } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Define the StatCardProps interface to match usage in StatCard component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBgColor: string;
  arrowIcon: React.ReactNode;
}

interface Library {
  id: number;
  library_code: string;
  name: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Safely handle useAuth to avoid errors if context is not provided
  let user = null;
  try {
    const authContext = useAuth();
    if (!authContext) {
      throw new Error('Auth context is not available');
    }
    user = authContext.user;
  } catch (error) {
    console.error('Auth context error:', error);
    toast.error('Authentication error. Please log in again.');
    navigate('/login');
    return null; // Prevent rendering if auth fails
  }

  const [updateTrigger, setUpdateTrigger] = useState(0); // Use a counter instead of boolean for more reliable updates
  const [studentStats, setStudentStats] = useState({ totalStudents: 0, activeStudents: 0, expiredMemberships: 0 });
  const [financialStats, setFinancialStats] = useState({ totalCollection: 0, totalDue: 0, totalExpense: 0, profitLoss: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  // Re-introducing collection and due to the state
  const [hostelStats, setHostelStats] = useState<{
    totalStudents: number;
    branches: { id: number; name: string; studentCount: number }[];
    expiredCount: number;
    totalCollection: number;
    totalDue: number;
  }>({ totalStudents: 0, branches: [], expiredCount: 0, totalCollection: 0, totalDue: 0 });
  const [hostelLoading, setHostelLoading] = useState(true);

  // Attendance management state
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceView, setAttendanceView] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);
  const [library, setLibrary] = useState<Library | null>(null);
  const [attendanceStats, setAttendanceStats] = useState({
    totalPresent: 0,
    totalCheckedIn: 0,
    totalCheckedOut: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  });
  
  // Sidebar state
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const loadLibraryInfo = async () => {
      if (!user) return;
      try {
        const profileData = await api.getLibraryProfile();
        if (profileData && profileData.library) {
          setLibrary({
            id: profileData.library.id,
            library_code: profileData.library.libraryCode,
            name: profileData.library.libraryName,
          });
        }
      } catch (error) {
        console.error("Failed to load library info:", error);
        toast.error("Could not load library information.");
      }
    };
    
    loadLibraryInfo();
  }, [user]);

  const handleBarcodeClick = () => {
    setShowBarcodeGenerator(true);
  };

  const fetchBranches = async () => {
    try {
      const branchesData = await api.getBranches();
      // getBranches now returns the array directly
      if (!branchesData || !Array.isArray(branchesData)) {
        throw new Error('Invalid branches data');
      }
      setBranches(branchesData);
    } catch (error: any) {
      toast.error('Failed to load branches');
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  };

  const fetchStats = async () => {
    try {
      const [totalStudentsResp, activeStudentsResp, expiredMembershipsResp] = await Promise.all([
        api.getTotalStudentsCount(selectedBranchId ?? undefined).catch(() => 0),
        api.getActiveStudentsCount(selectedBranchId ?? undefined).catch(() => 0),
        api.getExpiredMembershipsCount(selectedBranchId ?? undefined).catch(() => 0),
      ]);

      setStudentStats({
        totalStudents: Number(totalStudentsResp) || 0,
        activeStudents: Number(activeStudentsResp) || 0,
        expiredMemberships: Number(expiredMembershipsResp) || 0,
      });

      const financialResponse = await api.getDashboardStats(
        selectedBranchId ? { branchId: selectedBranchId } : undefined
      ).catch(() => ({
        totalCollection: 0,
        totalDue: 0,
        totalExpense: 0,
        profitLoss: 0,
      }));

      setFinancialStats({
        totalCollection: Number(financialResponse.totalCollection) || 0,
        totalDue: Number(financialResponse.totalDue) || 0,
        totalExpense: Number(financialResponse.totalExpense) || 0,
        profitLoss: Number(financialResponse.profitLoss) || 0,
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      } else {
        toast.error('Failed to load dashboard stats');
        console.error('Error fetching stats:', error);
        setStudentStats({ totalStudents: 0, activeStudents: 0, expiredMemberships: 0 });
        setFinancialStats({ totalCollection: 0, totalDue: 0, totalExpense: 0, profitLoss: 0 });
      }
    }
  };

  const fetchHostelStats = async () => {
    setHostelLoading(true);
    try {
      const [branches, allStudents, expiredData, collectionsData] = await Promise.all([
        api.getHostelBranches(),
        api.getHostelStudents(),
        api.getExpiredHostelStudents(),
        api.getHostelCollections(),
      ]);
      
      const studentCountByBranch = (allStudents ?? []).reduce((acc, student) => {
          const branchId = student.branchId;
          if (branchId) {
              acc[branchId] = (acc[branchId] || 0) + 1;
          }
          return acc;
      }, {});
      
      const branchesWithCount = (Array.isArray(branches) ? branches : []).map(branch => ({
          ...branch,
          studentCount: studentCountByBranch[branch.id] || 0,
      }));

      const expiredCount = expiredData?.expiredStudents?.length ?? 0;
      
      const collections = collectionsData?.collections ?? [];

      // FIX: Ensure values are treated as numbers before summing them up
      const totalCollection = collections.reduce((sum, c) => {
          const cash = parseFloat(String(c.cashPaid || 0));
          const online = parseFloat(String(c.onlinePaid || 0));
          return sum + cash + online;
      }, 0);

      const totalDue = collections.reduce((sum, c) => {
          const due = parseFloat(String(c.dueAmount || 0));
          return sum + due;
      }, 0);

      setHostelStats({
        totalStudents: Array.isArray(allStudents) ? allStudents.length : 0,
        branches: branchesWithCount,
        expiredCount,
        totalCollection,
        totalDue,
      });
    } catch (error: any) {
      toast.error('Failed to load hostel statistics');
      console.error('Error fetching hostel stats:', error);
    } finally {
      setHostelLoading(false);
    }
  };


  useEffect(() => {
    if (user) {
      fetchBranches();
      fetchStats();
      fetchHostelStats();
      loadAttendance();
    }
  }, [user, selectedBranchId]);

  useEffect(() => {
    if (user) {
      loadAttendance();
    }
  }, [attendanceView, selectedDate, attendanceSearchTerm]);

  const canManageStudents = user && (user.role === 'admin' || user.role === 'staff');

  const handleRefresh = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  // Attendance management functions
  const loadAttendance = async (page = 1) => {
    if (!user) return;
    setAttendanceLoading(true);
    try {
      const response = await api.fetchAttendance({
        date: selectedDate,
        search: attendanceSearchTerm,
        page,
        limit: pagination.limit,
        view: attendanceView,
      });
      setAttendance(response.attendance);
      setPagination(response.pagination);
      // Also update stats based on the new data if needed
      const checkedIn = response.attendance.filter(a => a.firstIn && !a.lastOut).length;
      const checkedOut = response.attendance.filter(a => a.lastOut).length;
      setAttendanceStats({
        totalPresent: response.pagination.totalRecords,
        totalCheckedIn: checkedIn,
        totalCheckedOut: checkedOut,
      });
    } catch (error) {
      console.error("Failed to load attendance:", error);
      toast.error("Could not load attendance records.");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not recorded';
    return new Date(timeString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} onBarcodeClick={handleBarcodeClick} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            <div className="mb-6">
              <label htmlFor="branch-select" className="text-sm font-medium text-gray-700 mr-2">
                Filter by Branch:
              </label>
              <select
                id="branch-select"
                value={selectedBranchId ?? 'all'}
                onChange={(e) => setSelectedBranchId(e.target.value === 'all' ? null : parseInt(e.target.value, 10))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="all">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <h2 className="text-xl font-semibold mb-4">Library Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Link to="/students" className="block">
                <StatCard
                  title="Total Students"
                  value={studentStats.totalStudents}
                  icon={<Users className="h-6 w-6 text-purple-500" />}
                  iconBgColor="bg-purple-100"
                  arrowIcon={<ChevronRight className="h-5 w-5 text-purple-400" />}
                />
              </Link>
              <Link to="/active-students" className="block">
                <StatCard
                  title="Active Students"
                  value={studentStats.activeStudents}
                  icon={<UserCheck className="h-6 w-6 text-blue-500" />}
                  iconBgColor="bg-blue-100"
                  arrowIcon={<ChevronRight className="h-5 w-5 text-blue-400" />}
                />
              </Link>
              <Link to="/expired-memberships" className="block">
                <StatCard
                  title="Expired Memberships"
                  value={studentStats.expiredMemberships}
                  icon={<AlertTriangle className="h-6 w-6 text-orange-500" />}
                  iconBgColor="bg-orange-100"
                  arrowIcon={<ChevronRight className="h-5 w-5 text-orange-400" />}
                />
              </Link>
            </div>
            <h2 className="text-xl font-semibold mb-4">Financial Overview (This Month)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Collection"
                value={financialStats.totalCollection}
                icon={<DollarSign className="h-6 w-6 text-green-500" />}
                iconBgColor="bg-green-100"
                arrowIcon={<ChevronRight className="h-5 w-5 text-green-400" />}
              />
              <StatCard
                title="Total Due"
                value={financialStats.totalDue}
                icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
                iconBgColor="bg-red-100"
                arrowIcon={<ChevronRight className="h-5 w-5 text-red-400" />}
              />
              <StatCard
                title="Total Expense"
                value={financialStats.totalExpense}
                icon={<TrendingDown className="h-6 w-6 text-yellow-500" />}
                iconBgColor="bg-yellow-100"
                arrowIcon={<ChevronRight className="h-5 w-5 text-yellow-400" />}
              />
              <StatCard
                title={financialStats.profitLoss >= 0 ? "Profit" : "Loss"}
                value={Math.abs(financialStats.profitLoss)}
                icon={
                  financialStats.profitLoss >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-teal-500" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  )
                }
                iconBgColor={financialStats.profitLoss >= 0 ? "bg-teal-100" : "bg-red-100"}
                arrowIcon={
                  <ChevronRight
                    className={`h-5 w-5 ${financialStats.profitLoss >= 0 ? "text-teal-400" : "text-red-400"}`}
                  />
                }
              />
            </div>
            
            {/* Registration Link Section */}
            {library && (
              <RegistrationLinkCard 
                libraryCode={library.library_code} 
                libraryName={library.name} 
              />
            )}
            
            {/* <div className="my-8">
              <h2 className="text-xl font-semibold mb-4">Hostel Overview</h2>
              {hostelLoading ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">Loading hostel stats...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard
                      title="Total Hostel Students"
                      value={hostelStats.totalStudents}
                      icon={<Users className="h-6 w-6 text-cyan-500" />}
                      iconBgColor="bg-cyan-100"
                      arrowIcon={<ChevronRight className="h-5 w-5 text-cyan-400" />}
                    />
                    <Link to="/hostel/collections" className="block">
                      <StatCard
                        title="Total Hostel Collection"
                        value={hostelStats.totalCollection}
                        icon={<DollarSign className="h-6 w-6 text-green-500" />}
                        iconBgColor="bg-green-100"
                        arrowIcon={<ChevronRight className="h-5 w-5 text-green-400" />}
                      />
                    </Link>
                    <Link to="/hostel/collections" className="block">
                      <StatCard
                        title="Total Hostel Due"
                        value={hostelStats.totalDue}
                        icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
                        iconBgColor="bg-red-100"
                        arrowIcon={<ChevronRight className="h-5 w-5 text-red-400" />}
                      />
                    </Link>
                    <Link to="/hostel/expired" className="block">
                      <StatCard
                        title="Expired Students"
                        value={hostelStats.expiredCount}
                        icon={<UserCheck className="h-6 w-6 text-orange-500" />}
                        iconBgColor="bg-orange-100"
                        arrowIcon={<ChevronRight className="h-5 w-5 text-orange-400" />}
                      />
                    </Link>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Branch Details</h3>
                    {hostelStats.branches.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {hostelStats.branches.map((branch) => (
                                <Link key={branch.id} to={`/hostel/branches/${branch.id}/students`} className="block p-4 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-lg text-gray-800 truncate">{branch.name}</h4>
                                        <div className="p-2 bg-indigo-100 rounded-full">
                                            <Home className="h-5 w-5 text-indigo-500" />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center text-sm text-gray-600">
                                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{branch.studentCount} Students</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                            No hostel branches have been added yet.
                        </div>
                    )}
                  </div>
                </>
              )}
            </div> */}

            {/* Attendance Management Section */}
            {canManageStudents && library && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">Attendance Management</h2>
                      <p className="text-blue-100">Monitor and manage student attendance</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <Calendar className="w-5 h-5 mb-1" />
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-transparent text-white placeholder-blue-200 border-0 focus:ring-0 p-0 text-sm font-medium"
                        />
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center">
                        <Search className="w-4 h-4 mr-2 text-white" />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={attendanceSearchTerm}
                          onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                          className="bg-transparent text-white placeholder-blue-200 border-0 focus:ring-0 p-0 text-sm font-medium w-48"
                        />
                      </div>
                      <button
                        onClick={() => setShowBarcodeGenerator(true)}
                        className="bg-green-500/20 backdrop-blur-sm hover:bg-green-500/30 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Generate QR</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Attendance Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Total Present</p>
                          <p className="text-2xl font-bold">{attendanceStats.totalPresent}</p>
                        </div>
                        <UserCheck className="w-8 h-8 text-blue-200" />
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Checked In</p>
                          <p className="text-2xl font-bold">{attendanceStats.totalCheckedIn}</p>
                        </div>
                        <Clock className="w-8 h-8 text-green-200" />
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Checked Out</p>
                          <p className="text-2xl font-bold">{attendanceStats.totalCheckedOut}</p>
                        </div>
                        <Clock className="w-8 h-8 text-red-200" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Records */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setAttendanceView('daily')}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            attendanceView === 'daily'
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Daily
                        </button>
                        <button
                          onClick={() => setAttendanceView('monthly')}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            attendanceView === 'monthly'
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Monthly
                        </button>
                      </div>
                    </div>
                  </div>

                  {attendanceLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading attendance...</p>
                    </div>
                  ) : attendance.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Number</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {attendance.map((record) => (
                              <tr key={record.studentId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                                    <div className="text-sm text-gray-500">{record.phone}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {record.registrationNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatTime(record.firstIn || '')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatTime(record.lastOut || '')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.lastOut ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {record.lastOut ? 'Checked Out' : 'Checked In'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {pagination.totalRecords > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                          <div className="flex flex-1 justify-between sm:hidden">
                            <button onClick={() => loadAttendance(pagination.page - 1)} disabled={pagination.page <= 1} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                            <button onClick={() => loadAttendance(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Next</button>
                          </div>
                          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.totalRecords)}</span> of{' '}
                                <span className="font-medium">{pagination.totalRecords}</span> results
                              </p>
                            </div>
                            <div>
                              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button onClick={() => loadAttendance(pagination.page - 1)} disabled={pagination.page <= 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                                  <span className="sr-only">Previous</span>
                                  <ChevronRight className="h-5 w-5 rotate-180" aria-hidden="true" />
                                </button>
                                <button onClick={() => loadAttendance(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                                  <span className="sr-only">Next</span>
                                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                              </nav>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Records</h3>
                      <p className="text-gray-500">No students have marked attendance for the selected date.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {canManageStudents && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Manage Library Students</h2>
                  {!showAddForm ? (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200"
                    >
                      Add Student
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        handleRefresh();
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {showAddForm && <AddStudentForm />}
                <StudentList key={updateTrigger.toString()} selectedBranchId={selectedBranchId} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold mb-4">Expiring Soon (Library)</h2>
              <ExpiringMemberships selectedBranchId={selectedBranchId} />
            </div>
          </div>
        </div>
      </div>

      {library && (
        <BarcodeGenerator
          isOpen={showBarcodeGenerator}
          libraryCode={library.library_code}
          libraryName={library.name}
          libraryId={library.id}
          onClose={() => setShowBarcodeGenerator(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;