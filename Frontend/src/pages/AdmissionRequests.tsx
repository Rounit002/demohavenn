import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  UserCheck, 
  UserX, 
  Users, 
  Filter,
  Search,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface AdmissionRequest {
  id: number;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  father_name?: string;
  aadhar_number?: string;
  registration_number?: string;
  branch_name?: string;
  seat_number?: string;
  locker_number?: string;
  membership_start?: string;
  membership_end?: string;
  total_fee: number;
  amount_paid: number;
  due_amount: number;
  cash: number;
  online: number;
  security_money: number;
  discount: number;
  remark?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  processed_at?: string;
  processed_by_username?: string;
  rejection_reason?: string;
  shift_ids: number[];
}

interface Stats {
  pending: number;
  accepted: number;
  rejected: number;
  total: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

const AdmissionRequests: React.FC = () => {
  const [requests, setRequests] = useState<AdmissionRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, accepted: 0, rejected: 0, total: 0 });
  const [pagination, setPagination] = useState<Pagination>({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modals
  const [selectedRequest, setSelectedRequest] = useState<AdmissionRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [statusFilter, currentPage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admission-requests?status=${statusFilter}&page=${currentPage}&limit=20`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch admission requests');
      }

      const data = await response.json();
      setRequests(data.requests);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load admission requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admission-requests/stats/summary', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      setProcessing(requestId);
      const response = await fetch(`/api/admission-requests/${requestId}/accept`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to accept request');
      }

      toast.success('Registration request accepted successfully!');
      fetchRequests();
      fetchStats();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept request');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(selectedRequest.id);
      const response = await fetch(`/api/admission-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to reject request');
      }

      toast.success('Registration request rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admission Requests</h1>
        <p className="text-gray-600">Manage student registration requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label>Filter by Status:</Label>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Requests</CardTitle>
          <CardDescription>
            {pagination.totalCount} total requests • Page {pagination.currentPage} of {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? 'No admission requests have been submitted yet.'
                  : `No ${statusFilter} requests found.`
                }
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.name}</p>
                          <p className="text-sm text-gray-500">ID: #{request.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {request.phone}
                          </div>
                          {request.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {request.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {request.branch_name || 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(request.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(request.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleAcceptRequest(request.id)}
                                disabled={processing === request.id}
                              >
                                {processing === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectModal(true);
                                }}
                                disabled={processing === request.id}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} requests
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Request Details</DialogTitle>
            <DialogDescription>
              Request ID: #{selectedRequest?.id} • Submitted: {selectedRequest && formatDate(selectedRequest.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge className={`${getStatusColor(selectedRequest.status)} flex items-center gap-1`}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </Badge>
              </div>

              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="membership">Membership</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="status">Status</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <p className="text-sm font-medium">{selectedRequest.name}</p>
                    </div>
                    <div>
                      <Label>Father's Name</Label>
                      <p className="text-sm">{selectedRequest.father_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm">{selectedRequest.phone}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm">{selectedRequest.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label>Aadhar Number</Label>
                      <p className="text-sm">{selectedRequest.aadhar_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label>Registration Number</Label>
                      <p className="text-sm">{selectedRequest.registration_number || 'Not provided'}</p>
                    </div>
                  </div>
                  {selectedRequest.address && (
                    <div>
                      <Label>Address</Label>
                      <p className="text-sm">{selectedRequest.address}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="membership" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Branch</Label>
                      <p className="text-sm">{selectedRequest.branch_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label>Seat</Label>
                      <p className="text-sm">{selectedRequest.seat_number || 'No preference'}</p>
                    </div>
                    <div>
                      <Label>Locker</Label>
                      <p className="text-sm">{selectedRequest.locker_number || 'Not requested'}</p>
                    </div>
                    <div>
                      <Label>Membership Start</Label>
                      <p className="text-sm">{selectedRequest.membership_start || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label>Membership End</Label>
                      <p className="text-sm">{selectedRequest.membership_end || 'Not specified'}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="payment" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Total Fee</Label>
                      <p className="text-sm font-medium">{formatCurrency(selectedRequest.total_fee)}</p>
                    </div>
                    <div>
                      <Label>Cash Payment</Label>
                      <p className="text-sm">{formatCurrency(selectedRequest.cash)}</p>
                    </div>
                    <div>
                      <Label>Online Payment</Label>
                      <p className="text-sm">{formatCurrency(selectedRequest.online)}</p>
                    </div>
                    <div>
                      <Label>Security Money</Label>
                      <p className="text-sm">{formatCurrency(selectedRequest.security_money)}</p>
                    </div>
                    <div>
                      <Label>Discount</Label>
                      <p className="text-sm">{formatCurrency(selectedRequest.discount)}</p>
                    </div>
                    <div>
                      <Label>Due Amount</Label>
                      <p className="text-sm font-medium">{formatCurrency(selectedRequest.due_amount)}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="status" className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label>Current Status</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getStatusColor(selectedRequest.status)} flex items-center gap-1`}>
                          {getStatusIcon(selectedRequest.status)}
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    {selectedRequest.processed_at && (
                      <div>
                        <Label>Processed At</Label>
                        <p className="text-sm">{formatDate(selectedRequest.processed_at)}</p>
                      </div>
                    )}
                    
                    {selectedRequest.processed_by_username && (
                      <div>
                        <Label>Processed By</Label>
                        <p className="text-sm">{selectedRequest.processed_by_username}</p>
                      </div>
                    )}
                    
                    {selectedRequest.rejection_reason && (
                      <div>
                        <Label>Rejection Reason</Label>
                        <p className="text-sm text-red-600">{selectedRequest.rejection_reason}</p>
                      </div>
                    )}
                    
                    {selectedRequest.remark && (
                      <div>
                        <Label>Student's Notes</Label>
                        <p className="text-sm">{selectedRequest.remark}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  onClick={() => selectedRequest && handleAcceptRequest(selectedRequest.id)}
                  disabled={processing === selectedRequest?.id}
                >
                  {processing === selectedRequest?.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="mr-2 h-4 w-4" />
                  )}
                  Accept Request
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing === selectedRequest?.id}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Reject Request
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this registration request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Reason for Rejection (Optional)</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRequest}
              disabled={processing === selectedRequest?.id}
            >
              {processing === selectedRequest?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserX className="mr-2 h-4 w-4" />
              )}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdmissionRequests;
