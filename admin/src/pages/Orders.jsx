import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Clock, Eye, X, User, ChevronRight } from 'lucide-react';
import OrderDetailModal from '../components/modals/OrderDetailModal';
import { NotificationForm } from '../components/modals/EntityForms';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const { isAdmin, user } = useAuth();
  const { globalStoreId, dateRange, searchQuery, setSearchQuery } = useFilters();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [showOnlyMe, setShowOnlyMe] = useState(false);
  
  // Notification State
  const [orderToNotify, setOrderToNotify] = useState(null);
  const [isRiderSelectOpen, setIsRiderSelectOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);

  const queryClient = useQueryClient();

  // Fetch Riders for selection
  const { data: ridersResp } = useQuery({
    queryKey: ['riders-list-simple'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/riders', { params: { pageSize: 100 } });
      return resp.data.data.riders.filter(r => r.approval_status === 'approved' && r.is_online);
    },
    enabled: isRiderSelectOpen
  });

  const sendNotifyMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/notifications/send', {
      targetType: 'user',
      targetValue: selectedRider?.user_id,
      title: data.title,
      body: data.body,
      data: { 
        type: 'NEW_ORDER_AVAILABLE',
        order_id: String(orderToNotify?.id),
        order_number: String(orderToNotify?.order_number),
        store_name: String(orderToNotify?.store?.name)
      }
    }),
    onSuccess: () => {
      setIsNotifyModalOpen(false);
      setIsRiderSelectOpen(false);
      alert('Notification sent to rider!');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to send notification');
    }
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['orders', pagination, status, globalStoreId, dateRange, searchQuery],
    queryFn: async () => {
      const storeIdToFetch = isAdmin ? globalStoreId : user.store_id;
      const resp = await apiClient.get('/admin/orders', {
        params: { 
          ...pagination, 
          status, 
          store_id: storeIdToFetch || undefined,
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined,
          search: searchQuery || undefined,
          user_id: showOnlyMe ? user.id : undefined
        }
      });
      return resp.data.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus, riderId }) => {
      setUpdatingId(orderId);
      return apiClient.patch(`/admin/orders/${orderId}/status`, { status: newStatus, rider_id: riderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      setUpdatingId(null);
    },
    onError: (err) => {
      console.error('Status Update Error:', err);
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
      setUpdatingId(null);
    }
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'delivered': return 'badge-active';
      case 'cancelled': 
      case 'failed': return 'badge-failed';
      case 'accepted':
      case 'out_for_delivery':
      case 'picked_up': return 'badge-delivery';
      case 'ready': return 'badge-ready';
      case 'preparing': return 'badge-processing';
      case 'placed':
      case 'confirmed': return 'badge-pending';
      default: return 'badge-pending';
    }
  };

  const getDeliveryTypeBadgeClass = (type) => {
    switch (type) {
      case 'express': return 'badge-express';
      case 'tomorrow_morning': return 'badge-tomorrow-morning';
      case 'tomorrow_evening': return 'badge-tomorrow-evening';
      default: return '';
    }
  };

  const columns = [
    { 
      header: 'Order #', 
      accessor: (row) => row.order_number,
      render: (row) => <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{row.order_number}</span>
    },
    { 
      header: 'Type', 
      accessor: (row) => row.delivery_type,
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span className={`badge ${getDeliveryTypeBadgeClass(row.delivery_type)}`} style={{ textTransform: 'capitalize' }}>
            {row.delivery_type === 'express' ? '⚡ Express' : '📅 Scheduled'}
          </span>
          {row.delivery_slot_label && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
              {row.delivery_slot_label}
            </span>
          )}
        </div>
      )
    },
    { header: 'Store', accessor: (row) => row.store?.name },
    { 
      header: 'Customer', 
      accessor: (row) => row.customer?.full_name,
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: '600' }}>{row.customer?.full_name}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{row.customer?.email}</span>
        </div>
      )
    },
    { 
      header: 'Rider', 
      accessor: (row) => row.rider?.full_name,
      render: (row) => row.rider ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: '600' }}>{row.rider.full_name}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{row.rider.phone}</span>
        </div>
      ) : <span className="badge" style={{ background: '#f1f5f9', color: '#94a3b8' }}>Unassigned</span>
    },
    { 
      header: 'Amount', 
      accessor: (row) => row.total_amount,
      align: 'right',
      render: (row) => <b>₹{Number(row.total_amount).toLocaleString()}</b>
    },
    { 
      header: 'Status', 
      accessor: (row) => row.status,
      align: 'center',
      render: (row) => (
        <span className={`badge ${getStatusBadgeClass(row.status)}`} style={{ textTransform: 'capitalize' }}>
          {row.status.replace(/_/g, ' ')}
        </span>
      )
    },
    { 
      header: 'Date', 
      accessor: (row) => row.created_at,
      align: 'center',
      render: (row) => new Date(row.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    },
    {
      header: 'Quick Actions',
      accessor: 'id',
      align: 'center',
      width: '240px',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {updatingId === row.id ? (
            <div className="animate-spin" style={{ color: 'var(--primary)' }}><Clock size={16} /></div>
          ) : (
            <>
              {row.status === 'placed' && (
                <button 
                  onClick={() => updateStatusMutation.mutate({ orderId: row.id, newStatus: 'confirmed' })}
                  className="btn-text-action btn-accept"
                >
                  Confirm
                </button>
              )}
              {row.status === 'confirmed' && (
                <button 
                  onClick={() => updateStatusMutation.mutate({ orderId: row.id, newStatus: 'preparing' })}
                  className="btn-text-action btn-prepare"
                >
                  Pack
                </button>
              )}
              {row.status === 'preparing' && (
                <button 
                  onClick={() => updateStatusMutation.mutate({ orderId: row.id, newStatus: 'ready' })}
                  className="btn-text-action btn-accept"
                >
                  Ready
                </button>
              )}
              {row.status === 'ready' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Waiting for Rider</span>
                  <button 
                    onClick={() => {
                      setOrderToNotify(row);
                      setIsRiderSelectOpen(true);
                    }}
                    className="btn-text-action btn-accept"
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                  >
                    Notify Rider
                  </button>
                </div>
              )}
              {row.status === 'accepted' && (
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>Accepted by Rider</span>
              )}
              
              {(['placed', 'confirmed', 'preparing', 'ready'].includes(row.status)) && (
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this order?')) {
                      updateStatusMutation.mutate({ orderId: row.id, newStatus: 'cancelled' });
                    }
                  }}
                  className="btn-text-action btn-cancel"
                >
                  Cancel
                </button>
              )}

              <button 
                className="btn-icon" 
                title="View Detail" 
                style={{ color: '#64748b' }}
                onClick={() => setSelectedOrder(row)}
              >
                <Eye size={16} />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Orders Management</h1>
          <p>Real-time order tracking and stage management.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '13px' }}
          >
            <option value="all">All Status</option>
            <option value="placed">Placed (New)</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready for Pickup</option>
            <option value="accepted">Accepted by Rider</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <DataTable 
        title="Orders"
        columns={columns}
        data={response?.orders || []}
        loading={isLoading || updateStatusMutation.isPending}
        pagination={response?.pagination || pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) => setPagination({ page: 1, pageSize })}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}

      {isRiderSelectOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '400px', padding: '24px', background: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Select Rider</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Online & Approved partners</p>
              </div>
              <button onClick={() => setIsRiderSelectOpen(false)} className="btn-icon" style={{ background: '#f1f5f9' }}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
              {ridersResp?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No online riders found</p>
                </div>
              ) : (
                ridersResp?.map(rider => (
                  <button
                    key={rider.id}
                    onClick={() => {
                      setSelectedRider(rider);
                      setIsNotifyModalOpen(true);
                    }}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border)', 
                      textAlign: 'left', 
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={18} color="var(--primary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{rider.user?.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{rider.store?.name || 'Daily Fresh'}</div>
                    </div>
                    <ChevronRight size={16} color="#cbd5e1" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isNotifyModalOpen && (
        <NotificationForm 
          targetName={selectedRider?.user?.full_name}
          onClose={() => setIsNotifyModalOpen(false)}
          onSend={(data) => sendNotifyMutation.mutate(data)}
          loading={sendNotifyMutation.isPending}
          initialData={{
            title: 'New Delivery Assignment 📦',
            body: `Order #${orderToNotify?.order_number} is ready for pickup at ${orderToNotify?.store?.name || 'Daily Fresh'}. Please accept the request.`
          }}
        />
      )}
    </div>
  );
};

export default Orders;
