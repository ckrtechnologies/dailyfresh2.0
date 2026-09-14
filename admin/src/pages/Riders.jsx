import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext, useLocation } from 'react-router-dom';
import { Plus, UserPlus } from 'lucide-react';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { StaffForm, NotificationForm } from '../components/modals/EntityForms';
import { useFilters } from '../context/FilterContext';

const Riders = ({ 
  storeId: propStoreId, 
  dateRange: propDateRange, 
  searchQuery: propSearchQuery,
  approvalStatus: propApprovalStatus 
} = {}) => {
  const filterContext = useFilters();
  const outletFilters = useOutletContext() || {};
  const location = useLocation();
  const navState = location.state || {};

  const globalStoreId = propStoreId ?? navState.storeId ?? outletFilters.globalStoreId ?? filterContext.globalStoreId;
  const dateRange = propDateRange ?? (
    navState.startDate !== undefined || navState.endDate !== undefined
      ? { startDate: navState.startDate || '', endDate: navState.endDate || '' }
      : (outletFilters.dateRange ?? filterContext.dateRange)
  );
  const searchQuery = propSearchQuery ?? navState.search ?? outletFilters.searchQuery ?? filterContext.searchQuery;
  const setSearchQuery = outletFilters.setSearchQuery ?? filterContext.setSearchQuery;

  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
  const [approvalStatus, setApprovalStatus] = useState(
    propApprovalStatus || navState.approvalStatus || (navState.filter === 'approved' ? 'approved' : 'all')
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);

  useEffect(() => {
    if (navState.approvalStatus) {
      setApprovalStatus(navState.approvalStatus);
    } else if (navState.filter === 'approved') {
      setApprovalStatus('approved');
    }
    if (navState.storeId !== undefined && navState.storeId !== filterContext.globalStoreId) {
      filterContext.setGlobalStoreId(navState.storeId);
    }
    if (
      (navState.startDate !== undefined || navState.endDate !== undefined) &&
      (navState.startDate !== filterContext.dateRange?.startDate || navState.endDate !== filterContext.dateRange?.endDate)
    ) {
      filterContext.setDateRange({
        startDate: navState.startDate || '',
        endDate: navState.endDate || ''
      });
    }
  }, [navState]);

  // Fetch Riders
  const { data: response, isLoading } = useQuery({
    queryKey: ['riders', pagination, searchQuery, globalStoreId, dateRange, approvalStatus],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/riders', {
        params: {
          ...pagination,
          search: searchQuery || undefined,
          store_id: globalStoreId || undefined,
          startDate: dateRange?.startDate || undefined,
          endDate: dateRange?.endDate || undefined,
          approval_status: approvalStatus !== 'all' ? approvalStatus : undefined
        }
      });
      return resp.data.data;
    }
  });

  // Fetch Stores for onboarding dropdown
  const { data: storesResp } = useQuery({
    queryKey: ['admin-stores-list'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/stores');
      return resp.data.data.stores;
    }
  });

  // Onboard Rider Mutation
  const onboardMutation = useMutation({
    mutationFn: (newRider) => apiClient.post('/admin/onboard-staff', newRider),
    onSuccess: () => {
      queryClient.invalidateQueries(['riders']);
      setIsModalOpen(false);
      alert('Rider onboarded successfully!');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Onboarding failed');
    }
  });

  // Update Rider Mutation
  const updateRiderMutation = useMutation({
    mutationFn: ({ id, updates }) => apiClient.patch(`/admin/riders/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['riders']);
      queryClient.invalidateQueries(['dashboard-stats']);
    }
  });

  // Send Notification Mutation
  const sendNotifyMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/notifications/send', {
      targetType: 'user',
      targetValue: selectedRider?.user_id,
      title: data.title,
      body: data.body,
      data: { type: 'admin_direct' }
    }),
    onSuccess: () => {
      setIsNotifyModalOpen(false);
      alert('Notification sent to rider!');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to send notification');
    }
  });

  const columns = [
    {
      header: 'Name',
      accessor: (row) => row.user?.full_name
    },
    {
      header: 'Phone',
      accessor: (row) => row.user?.phone
    },
    {
      header: 'Assigned Store',
      accessor: (row) => row.store?.name || 'Unassigned'
    },
    {
      header: 'Vehicle',
      accessor: (row) => `${row.vehicle_type || ''} (${row.vehicle_number || 'N/A'})`
    },
    {
      header: 'Online',
      accessor: (row) => row.is_online,
      align: 'center',
      render: (row) => (
        <button
          onClick={() => updateRiderMutation.mutate({ id: row.id, updates: { is_online: !row.is_online } })}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: row.is_online ? 'var(--success)' : 'var(--text-muted)',
            fontWeight: '500',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            margin: '0 auto'
          }}
          title={`Click to mark ${row.is_online ? 'Offline' : 'Online'}`}
        >
          {row.is_online ? '● Online' : '○ Offline'}
        </button>
      )
    },
    {
      header: 'Status',
      accessor: (row) => row.approval_status,
      align: 'center',
      render: (row) => (
        <span className={`badge badge-${row.approval_status === 'approved' ? 'active' : row.approval_status === 'rejected' ? 'failed' : 'pending'}`}>
          {row.approval_status}
        </span>
      )
    },
    // {
    //   header: 'Actions',
    //   align: 'right',
    //   render: (row) => (
    //     <button
    //       className="btn-icon"
    //       onClick={() => {
    //         setSelectedRider(row);
    //         setIsNotifyModalOpen(true);
    //       }}
    //       title="Send Notification"
    //       style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }}
    //     >
    //       <Plus size={16} />
    //     </button>
    //   )
    // }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Riders</h1>
          <p>Manage delivery partners and approval status</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            value={approvalStatus}
            onChange={(e) => setApprovalStatus(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '13px', background: 'white' }}
          >
            <option value="all">All Riders</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="page-actions">
            <button
              className="btn-compact"
              onClick={() => setIsModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: 'white', border: 'none' }}
            >
              <UserPlus size={14} /> Onboard Rider
            </button>
          </div>
        </div>
      </div>

      <DataTable
        title="Riders"
        columns={columns}
        data={response?.riders || []}
        loading={isLoading}
        pagination={response?.pagination || pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) => setPagination({ page: 1, pageSize })}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {isModalOpen && (
        <StaffForm
          type="rider"
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => onboardMutation.mutate(data)}
          loading={onboardMutation.isPending}
          stores={storesResp || []}
        />
      )}

      {isNotifyModalOpen && (
        <NotificationForm 
          targetName={selectedRider?.user?.full_name || 'Rider'}
          onClose={() => setIsNotifyModalOpen(false)}
          onSend={(data) => sendNotifyMutation.mutate(data)}
          loading={sendNotifyMutation.isPending}
        />
      )}
    </div>
  );
};

export default Riders;
