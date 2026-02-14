// frontend/src/pages/super-admin/Requests.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Building2, Mail, Phone, User, Eye, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, LoadingSpinner, EmptyState } from '../../components/shared';
import api from '../../services/api';
import { formatDate, formatRelativeTime } from '../../utils/helpers';

const BusinessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/onboarding/requests');
      setRequests(response.data || []);
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this business?')) return;
    
    try {
      await api.post(`/api/onboarding/requests/${id}/approve`);
      toast.success('Business approved successfully!');
      fetchRequests();
      setDetailsModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve business');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection (optional):');
    
    try {
      await api.post(`/api/onboarding/requests/${id}/reject`, { reason });
      toast.success('Business rejected');
      fetchRequests();
      setDetailsModalOpen(false);
    } catch (error) {
      toast.error('Failed to reject business');
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus === 'all') return true;
    return req.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    const configs = {
      pending: { variant: 'warning', icon: Clock, label: 'Pending' },
      approved: { variant: 'success', icon: CheckCircle, label: 'Approved' },
      rejected: { variant: 'danger', icon: XCircle, label: 'Rejected' },
    };
    return configs[status] || configs.pending;
  };

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    total: requests.length,
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Requests</h1>
        <p className="text-gray-600">Review and manage business registration applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <h3 className="text-3xl font-bold text-orange-600">{stats.pending}</h3>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Approved</p>
              <h3 className="text-3xl font-bold text-green-600">{stats.approved}</h3>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <h3 className="text-3xl font-bold text-red-600">{stats.rejected}</h3>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <h3 className="text-3xl font-bold text-blue-600">{stats.total}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No requests found"
            description="No business registration requests match your filter"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredRequests.map((request, index) => {
            const statusConfig = getStatusBadge(request.status);
            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {request.businessName}
                        </h3>
                        <Badge variant={statusConfig.variant} icon={statusConfig.icon}>
                          {statusConfig.label}
                        </Badge>
                        {request.businessType && (
                          <span className="ml-2 inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            {request.businessType}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatRelativeTime(request.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{request.ownerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{request.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{request.phone}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Applied on {formatDate(request.createdAt, 'short')}
                    </div>
                  </div>

                  {request.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {request.description}
                    </p>
                  )}

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Eye}
                      onClick={() => viewDetails(request)}
                    >
                      View Details
                    </Button>

                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          icon={CheckCircle}
                          onClick={() => handleApprove(request.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={XCircle}
                          onClick={() => handleReject(request.id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Business Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedRequest.businessName}
                </h3>
                <Badge variant={getStatusBadge(selectedRequest.status).variant}>
                  {getStatusBadge(selectedRequest.status).label}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Business Type
                </label>
                <p className="text-gray-900">{selectedRequest.businessType || 'Not specified'}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Owner Name
                </label>
                <p className="text-gray-900">{selectedRequest.ownerName}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Email
                </label>
                <p className="text-gray-900">{selectedRequest.email}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Phone
                </label>
                <p className="text-gray-900">{selectedRequest.phone}</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Applied Date
                </label>
                <p className="text-gray-900">{formatDate(selectedRequest.createdAt, 'full')}</p>
              </div>
            </div>

            {selectedRequest.description && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Business Description
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">{selectedRequest.description}</p>
                </div>
              </div>
            )}

            {selectedRequest.rejectionReason && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Rejection Reason
                </label>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-red-700">{selectedRequest.rejectionReason}</p>
                </div>
              </div>
            )}

            {selectedRequest.status === 'pending' && (
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  variant="success"
                  icon={CheckCircle}
                  onClick={() => handleApprove(selectedRequest.id)}
                  fullWidth
                >
                  Approve Business
                </Button>
                <Button
                  variant="danger"
                  icon={XCircle}
                  onClick={() => handleReject(selectedRequest.id)}
                  fullWidth
                >
                  Reject Business
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BusinessRequests;