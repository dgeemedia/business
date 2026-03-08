// frontend/src/pages/super-admin/Requests.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Building2, Mail, Phone, User, Eye, Filter, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';   // ✅ ADDED
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, LoadingSpinner, EmptyState } from '../../components/shared';
import api from '../../services/api';
import { formatDate, formatRelativeTime } from '../../utils/helpers';

const BusinessRequests = () => {
  const navigate = useNavigate();                  // ✅ ADDED
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

  // ✅ UPDATED — passes full request object, routes to Create Business with pre-filled data
  const handleApprove = async (request) => {
    const id = typeof request === 'object' ? request.id : request;
    const fullRequest = typeof request === 'object' ? request : requests.find(r => r.id === id);

    if (!confirm(`Approve "${fullRequest?.businessName}"?\n\nThis will open the Create Business form pre-filled with their details.`)) return;

    try {
      const res = await api.post(`/api/onboarding/requests/${id}/approve`);
      toast.success(`✅ "${fullRequest?.businessName}" approved!`);

      // Show referral bonus toast if applicable
      if (fullRequest?.referralCode && !fullRequest?.referralApplied) {
        setTimeout(() => toast.success('💰 ₦500 referral bonus credited to referrer!'), 700);
      }

      fetchRequests();
      setDetailsModalOpen(false);

      // Navigate to businesses page with pre-filled form data
      if (res.data.prefillData) {
        const encoded = btoa(JSON.stringify(res.data.prefillData));
        setTimeout(() => navigate(`/super-admin/businesses?prefill=${encoded}`), 900);
      }
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

  // ✅ ADDED — re-open Create Business form for already-approved public requests
  const handleCreateBusiness = (request) => {
    const prefillData = {
      businessName:   request.businessName,
      businessType:   request.businessType,
      description:    request.description    || '',
      phone:          request.ownerPhone     || '',
      whatsappNumber: request.ownerPhone     || '',
      adminEmail:     request.ownerEmail     || '',
      adminFirstName: (request.ownerName || '').split(' ')[0] || '',
      adminLastName:  (request.ownerName || '').split(' ').slice(1).join(' ') || '',
      adminPhone:     request.ownerPhone     || '',
      slug:           (request.preferredSlug || request.businessName)
                        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      referralCode:   request.referralCode   || '',
      onboardingRequestId: request.id,
    };
    const encoded = btoa(JSON.stringify(prefillData));
    navigate(`/super-admin/businesses?prefill=${encoded}`);
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
      pending:  { variant: 'warning', icon: Clock,       label: 'Pending'  },
      approved: { variant: 'success', icon: CheckCircle, label: 'Approved' },
      rejected: { variant: 'danger',  icon: XCircle,     label: 'Rejected' },
    };
    return configs[status] || configs.pending;
  };

  const stats = {
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    total:    requests.length,
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
                      <span className="text-sm">{request.ownerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{request.ownerPhone}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Applied on {formatDate(request.createdAt, 'short')}
                    </div>
                    {request.referralCode && (
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-mono font-semibold text-emerald-700">
                          Referred: {request.referralCode}
                          {/* ✅ Show credited badge if bonus already awarded */}
                          {request.referralApplied && (
                            <span className="ml-2 text-[11px] text-emerald-600 font-bold not-italic">
                              ✓ ₦500 credited
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {request.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {request.description}
                    </p>
                  )}

                  <div className="flex gap-3 pt-4 border-t flex-wrap">
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
                        {/* ✅ UPDATED — passes full request object */}
                        <Button
                          size="sm"
                          variant="success"
                          icon={CheckCircle}
                          onClick={() => handleApprove(request)}
                        >
                          Approve & Create
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

                    {/* ✅ ADDED — re-open Create Business form for approved public requests */}
                    {request.status === 'approved' && !request.adminCreated && (
                      <Button
                        size="sm"
                        variant="info"
                        icon={Building2}
                        onClick={() => handleCreateBusiness(request)}
                      >
                        Create Business
                      </Button>
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
                <label className="text-sm font-semibold text-gray-700 block mb-1">Business Type</label>
                <p className="text-gray-900">{selectedRequest.businessType || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Owner Name</label>
                <p className="text-gray-900">{selectedRequest.ownerName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Email</label>
                <p className="text-gray-900">{selectedRequest.ownerEmail}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Phone</label>
                <p className="text-gray-900">{selectedRequest.ownerPhone}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 block mb-1">Applied Date</label>
                <p className="text-gray-900">{formatDate(selectedRequest.createdAt, 'full')}</p>
              </div>

              {selectedRequest.referralCode && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Referral Code Used</label>
                  <div className="flex items-center gap-3">
                    <Gift className="w-4 h-4 text-emerald-500" />
                    <span className="font-mono font-bold text-emerald-700 tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg text-sm">
                      {selectedRequest.referralCode}
                    </span>
                    {/* ✅ Show credited status in modal */}
                    {selectedRequest.referralApplied
                      ? <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5"/> ₦500 credited to referrer
                        </span>
                      : <span className="text-xs text-amber-600 font-semibold">Will be credited on approval</span>
                    }
                  </div>
                </div>
              )}
            </div>

            {selectedRequest.description && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Business Description</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">{selectedRequest.description}</p>
                </div>
              </div>
            )}

            {selectedRequest.rejectionReason && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Rejection Reason</label>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-red-700">{selectedRequest.rejectionReason}</p>
                </div>
              </div>
            )}

            {selectedRequest.status === 'pending' && (
              <div className="flex gap-3 pt-6 border-t">
                {/* ✅ UPDATED — passes full selectedRequest object */}
                <Button variant="success" icon={CheckCircle} onClick={() => handleApprove(selectedRequest)} fullWidth>
                  Approve & Create Business
                </Button>
                <Button variant="danger" icon={XCircle} onClick={() => handleReject(selectedRequest.id)} fullWidth>
                  Reject Business
                </Button>
              </div>
            )}

            {/* ✅ ADDED — Create Business button in modal for approved public requests */}
            {selectedRequest.status === 'approved' && !selectedRequest.adminCreated && (
              <div className="pt-6 border-t">
                <Button
                  variant="primary"
                  icon={Building2}
                  onClick={() => { setDetailsModalOpen(false); handleCreateBusiness(selectedRequest); }}
                  fullWidth
                >
                  Open Create Business Form
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