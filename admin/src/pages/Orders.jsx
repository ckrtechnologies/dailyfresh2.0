import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Truck, XCircle, Eye } from 'lucide-react';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const { isAdmin, user } = useAuth();
  const { globalStoreId, dateRange, searchQuery } = useFilters();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
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
          user_id: showOnlyMe ? user.id : undefined // Added to backend support below
        }
      });
      return resp.data.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }) => {
      setUpdatingId(orderId);
      return apiClient.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
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
      case 'cancelled': return 'badge-failed';
      case 'out_for_delivery': return 'badge-delivery';
      case 'preparing': return 'badge-processing';
      case 'accepted': return 'badge-active';
      default: return 'badge-pending';
    }
  };

  const columns = [
    { 
      header: 'Order #', 
      accessor: (row) => row.order_number,
      render: (row) => <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{row.order_number}</span>
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
      header: 'Created At', 
      accessor: (row) => new Date(row.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
      align: 'center'
    },
    {
      header: 'Quick Actions',
      accessor: 'id',
      align: 'center',
      width: '220px',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {updatingId === row.id ? (
            <div className="animate-spin" style={{ color: 'var(--primary)' }}><Clock size={16} /></div>
          ) : (
            <>
              {(row.status === 'pending' || row.status === 'confirmed') && (
                <button 
                  onClick={() => updateStatusMutation.mutate({ orderId: row.id, newStatus: 'accepted' })}
                  className="btn-text-action btn-accept"
                >
                  Accept
                </button>
              )}
              {row.status === 'accepted' && (
                <button 
                  onClick={() => updateStatusMutation.mutate({ orderId: row.id, newStatus: 'preparing' })}
                  className="btn-text-action btn-prepare"
                >
                  Prepare
                </button>
              )}
              {row.status === 'preparing' && (
                <button 
                  onClick={() => updateStatusMutation.mutate({ orderId: row.id, newStatus: 'out_for_delivery' })}
                  className="btn-text-action btn-dispatch"
                >
                  Dispatch
                </button>
              )}
              
              {(row.status === 'pending' || row.status === 'confirmed' || row.status === 'accepted') && (
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

              <button className="btn-icon" title="View Detail" style={{ color: '#64748b', marginLeft: '4px' }}>
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
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed (Paid)</option>
            <option value="accepted">Accepted</option>
            <option value="preparing">Preparing</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="search-container" style={{ position: 'relative', width: '250px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search Customer or Order #..." 
              style={{ padding: '6px 12px 6px 32px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '13px', width: '100%' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // This triggers the useFilters global search
                  // Or we can add a local page-specific search state
                }
              }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', background: 'white', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <input 
              type="checkbox" 
              checked={showOnlyMe}
              onChange={(e) => setShowOnlyMe(e.target.checked)}
            />
            My Orders Only
          </label>
        </div>
      </div>

      {(dateRange.startDate || dateRange.endDate) && (
        <div style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
          <span>Active Date Filter: <b>{dateRange.startDate || 'Any'}</b> to <b>{dateRange.endDate || 'Any'}</b></span>
          <button onClick={() => setDateRange({ startDate: '', endDate: '' })} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear Dates</button>
        </div>
      )}

      <DataTable 
        title="Orders"
        columns={columns}
        data={response?.orders || []}
        loading={isLoading || updateStatusMutation.isPending}
        pagination={response?.pagination || pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) => setPagination({ page: 1, pageSize })}
      />
    </div>
  );
};

export default Orders;
