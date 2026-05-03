import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Clock, Eye } from 'lucide-react';
import OrderDetailModal from '../components/modals/OrderDetailModal';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const { isAdmin, user } = useAuth();
  const { globalStoreId, dateRange, searchQuery } = useFilters();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [showOnlyMe, setShowOnlyMe] = useState(false);
  const queryClient = useQueryClient();

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
      case 'today_evening': return 'badge-today-evening';
      case 'tmrw_morning': return 'badge-tomorrow-morning';
      case 'tmrw_evening': return 'badge-tomorrow-evening';
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
        <span className={`badge ${getDeliveryTypeBadgeClass(row.delivery_type)}`} style={{ textTransform: 'capitalize' }}>
          {row.delivery_type?.replace(/_/g, ' ')}
        </span>
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
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Waiting for Rider</span>
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

          <div className="search-container" style={{ position: 'relative', width: '250px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search Customer or Order #..." 
              style={{ padding: '6px 12px 6px 32px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '13px', width: '100%' }}
            />
          </div>
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
      />

      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

export default Orders;
