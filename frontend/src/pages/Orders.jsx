// frontend/src/pages/Orders.jsx
import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, XCircle, Package, Download, Users } from 'lucide-react';  // ✅ added Download, Users
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, LoadingSpinner, EmptyState, Input } from '../components/shared';
import orderService from '../services/orderService';
import { formatCurrency, formatDate, formatRelativeTime, exportToCSV } from '../utils/helpers';  // ✅ added exportToCSV

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await orderService.cancelOrder(orderId);
      toast.success('Order cancelled');
      fetchOrders();
      setDetailsModalOpen(false);
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  // ✅ CSV Export — Orders
  const handleExportOrders = () => {
    if (!orders || orders.length === 0) return toast.error('No orders to export');
    const rows = orders.map(o => {
      const itemList = (o.items || [])
        .map(item => {
          const name  = item.productName ?? item.product?.name ?? 'Unknown';
          const price = item.price ?? item.unitPrice ?? 0;
          return `${name} ×${item.quantity} @₦${price}`;
        })
        .join(' | ');
      return {
        'Order ID':       o.orderNumber || String(o.id).padStart(6, '0'),
        'Customer Name':  o.customerName    || '',
        'Phone':          getPhone(o),
        'Email':          getEmail(o),
        'Address':        getAddress(o),
        'Items':          itemList,
        'Item Count':     o.items?.length   || 0,
        'Total (₦)':      Number(getTotal(o)).toFixed(2),
        'Status':         o.status          || '',
        'Note':           o.message         || '',
        'Date':           o.createdAt ? formatDate(o.createdAt, 'medium') : '',
      };
    });
    exportToCSV(rows, 'orders');
    toast.success(`Exported ${rows.length} order${rows.length !== 1 ? 's' : ''}`);
  };

  // ✅ CSV Export — Customers (deduplicated from orders)
  const handleExportCustomers = () => {
    if (!orders || orders.length === 0) return toast.error('No customer data to export');
    const seen = new Map();
    for (const o of orders) {
      const phone = getPhone(o);
      const email = getEmail(o);
      const key   = email || phone || o.customerName || String(o.id);
      const total = getTotal(o);
      if (seen.has(key)) {
        const existing = seen.get(key);
        existing['Total Orders']++;
        existing['Total Spend (₦)'] = (parseFloat(existing['Total Spend (₦)']) + Number(total)).toFixed(2);
        if (o.createdAt && new Date(o.createdAt) > new Date(existing['Last Order'])) {
          existing['Last Order'] = formatDate(o.createdAt, 'medium');
        }
      } else {
        seen.set(key, {
          'Customer Name':   o.customerName || '',
          'Phone':           phone,
          'Email':           email,
          'Address':         getAddress(o),
          'Total Orders':    1,
          'Total Spend (₦)': Number(total).toFixed(2),
          'First Order':     o.createdAt ? formatDate(o.createdAt, 'medium') : '',
          'Last Order':      o.createdAt ? formatDate(o.createdAt, 'medium') : '',
        });
      }
    }
    const customers = Array.from(seen.values())
      .sort((a, b) => parseFloat(b['Total Spend (₦)']) - parseFloat(a['Total Spend (₦)']));
    exportToCSV(customers, 'customers');
    toast.success(`Exported ${customers.length} unique customer${customers.length !== 1 ? 's' : ''}`);
  };

  const getOrderLabel = (order) => {
    if (order.orderNumber) return order.orderNumber;
    return String(order.id).padStart(6, '0');
  };

  const getTotal   = (order) => order.total ?? order.totalAmount ?? 0;
  const getPhone   = (order) => order.customerPhone ?? order.phone ?? '';
  const getAddress = (order) => order.deliveryAddress ?? order.address ?? '';
  const getEmail   = (order) => order.customerEmail ?? order.email ?? '';

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEmail(order).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(order.id).includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status) => {
    const configs = {
      PENDING:          { variant: 'warning', icon: Clock,        label: 'Pending'          },
      CONFIRMED:        { variant: 'info',    icon: CheckCircle,  label: 'Confirmed'        },
      PREPARING:        { variant: 'info',    icon: Package,      label: 'Preparing'        },
      READY:            { variant: 'success', icon: CheckCircle,  label: 'Ready'            },
      OUT_FOR_DELIVERY: { variant: 'info',    icon: Package,      label: 'Out for Delivery' },
      DELIVERED:        { variant: 'success', icon: CheckCircle,  label: 'Delivered'        },
      CANCELLED:        { variant: 'danger',  icon: XCircle,      label: 'Cancelled'        },
    };
    return configs[status] || configs.PENDING;
  };

  const orderStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
        <p className="text-gray-600">View and manage customer orders</p>
      </div>

      {/* ── Export bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700">Export Data</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Download your full orders list or customer directory as a CSV file
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={handleExportOrders}
            disabled={orders.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Download className="w-4 h-4 flex-shrink-0"/>
            Orders {orders.length > 0 && `(${orders.length})`}
          </button>
          <button
            onClick={handleExportCustomers}
            disabled={orders.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50 text-gray-700 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Users className="w-4 h-4 flex-shrink-0"/>
            Customers
          </button>
        </div>
      </div>

      {/* ── Search & filter ───────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by order number, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {orderStatuses.map(status => (
                <option key={status} value={status}>
                  {getStatusConfig(status).label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* ── Orders table ──────────────────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            title="No orders found"
            description={searchTerm ? 'Try adjusting your search' : 'Orders from customers will appear here'}
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order, index) => {
                  const statusConfig = getStatusConfig(order.status);
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => viewOrderDetails(order)}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-medium text-primary-600">
                          #{getOrderLabel(order)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{order.customerName}</p>
                          <p className="text-sm text-gray-500">{getEmail(order)}</p>
                          {getPhone(order) && (
                            <p className="text-xs text-gray-500">{getPhone(order)}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {order.items?.length || 0} item(s)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(getTotal(order))}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusConfig.variant} icon={statusConfig.icon}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-gray-700">{formatDate(order.createdAt, 'short')}</p>
                          <p className="text-xs text-gray-500">{formatRelativeTime(order.createdAt)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); viewOrderDetails(order); }}
                        >
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Order Details Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Order #{getOrderLabel(selectedOrder)}
                </h3>
                <p className="text-sm text-gray-500">
                  Placed on {formatDate(selectedOrder.createdAt, 'full')}
                </p>
              </div>
              <Badge variant={getStatusConfig(selectedOrder.status).variant}>
                {getStatusConfig(selectedOrder.status).label}
              </Badge>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {selectedOrder.customerName}</p>
                {getEmail(selectedOrder) && (
                  <p><span className="font-medium">Email:</span> {getEmail(selectedOrder)}</p>
                )}
                {getPhone(selectedOrder) && (
                  <p><span className="font-medium">Phone:</span> {getPhone(selectedOrder)}</p>
                )}
                {getAddress(selectedOrder) && (
                  <p><span className="font-medium">Address:</span> {getAddress(selectedOrder)}</p>
                )}
                {selectedOrder.message && (
                  <p><span className="font-medium">Note:</span> {selectedOrder.message}</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, index) => {
                  const name  = item.productName ?? item.product?.name ?? 'Unknown Product';
                  const price = item.price ?? item.unitPrice ?? 0;
                  return (
                    <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{name}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(price * item.quantity)}
                        </p>
                        <p className="text-sm text-gray-500">{formatCurrency(price)} each</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t-2 border-gray-200">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">
                    {formatCurrency(getTotal(selectedOrder))}
                  </span>
                </div>
              </div>
            </div>

            {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Update Order Status</h4>
                <div className="flex flex-wrap gap-2">
                  {orderStatuses
                    .filter(s => s !== 'CANCELLED' && s !== selectedOrder.status)
                    .map(status => (
                      <Button
                        key={status}
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                      >
                        Mark as {getStatusConfig(status).label}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
                <Button
                  variant="danger"
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  fullWidth
                >
                  Cancel Order
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setDetailsModalOpen(false)}
                fullWidth
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;