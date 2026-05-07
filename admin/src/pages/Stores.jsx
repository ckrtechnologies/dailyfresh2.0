import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Store, UserPlus } from 'lucide-react';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';
import { StoreForm, StaffForm } from '../components/modals/EntityForms';

const Stores = () => {
  const { searchQuery, setSearchQuery } = useFilters();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
  const [modal, setModal] = useState({ show: false, data: null });
  const [onboardModal, setOnboardModal] = useState(false);

  // 1. Fetch Stores
  const { data: storeResp, isLoading: storeLoading } = useQuery({
    queryKey: ['stores', pagination, searchQuery],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/stores', { 
        params: { ...pagination, search: searchQuery || undefined } 
      });
      return resp.data.data;
    }
  });

  // 2. Fetch Managers for assignment
  const { data: managerResp } = useQuery({
    queryKey: ['staff', 'store_manager'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/staff', { params: { role: 'store_manager' } });
      return resp.data.data.staff;
    }
  });

  // 3. CRUD Mutation
  const mutation = useMutation({
    mutationFn: async ({ method, id, data, deleteManager }) => {
      let url = `/admin/stores${id ? `/${id}` : ''}`;
      if (deleteManager) url += '?delete_manager=true';
      return method === 'DELETE' ? apiClient.delete(url) : (id ? apiClient.patch(url, data) : apiClient.post(url, data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stores']);
      setModal({ show: false, data: null });
    }
  });

  // 4. Onboard Manager Mutation
  const onboardMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/onboard-staff', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['managers']);
      setOnboardModal(false);
      alert('Manager onboarded successfully!');
    },
    onError: (err) => alert(err.response?.data?.message || 'Onboarding failed')
  });

  const handleDelete = (id, hasManager) => {
    let deleteManager = false;
    if (hasManager) {
      const choice = window.confirm('This store has an assigned manager. \n\nClick OK to delete BOTH Store and Manager. \nClick CANCEL to delete ONLY the Store.');
      if (choice) deleteManager = true;
      else {
        // If they clicked cancel, ask if they still want to delete the store at least
        if (!window.confirm('Are you sure you want to delete the store only?')) return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this store?')) return;
    }

    mutation.mutate({ method: 'DELETE', id, deleteManager });
  };

  const columns = [
    { header: 'Store Name', accessor: 'name', render: (row) => <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{row.name}</div> },
    { header: 'Manager', accessor: (row) => row.manager?.full_name || 'Unassigned' },
    { header: 'Location', accessor: 'city', render: (row) => <span>{row.address}, {row.pincode}</span> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Status', accessor: 'is_active', align: 'center', render: (row) => (
      <span className={`badge badge-${row.is_active ? 'active' : 'failed'}`}>{row.is_active ? 'Active' : 'Closed'}</span>
    )},
    { header: 'Actions', accessor: 'id', align: 'center', render: (row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button onClick={() => setModal({ show: true, data: row })} className="btn-icon"><Pencil size={12} /></button>
        <button onClick={() => handleDelete(row.id, !!row.manager_user_id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
      </div>
    )}
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Store Management</h1>
          <p>Configure physical locations and assign store managers.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setOnboardModal(true)} 
            className="btn-compact" 
            style={{ background: '#f1f5f9', color: 'var(--text-main)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={14} /> Add Manager
          </button>
          <button 
            onClick={() => setModal({ show: true, data: null })} 
            className="btn-compact" 
            style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={14} /> Add Store
          </button>
        </div>
      </div>

      <DataTable 
        title="Physical Locations"
        columns={columns}
        data={storeResp?.stores || []}
        loading={storeLoading}
        pagination={{ total: storeResp?.stores?.length, page: 1, pageSize: 50 }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {modal.show && (
        <StoreForm 
          initialData={modal.data}
          loading={mutation.isPending}
          managers={managerResp?.map(m => ({ id: m.id, name: m.full_name })) || []}
          onClose={() => setModal({ show: false, data: null })}
          onSave={(data) => mutation.mutate({ id: modal.data?.id, method: modal.data ? 'PATCH' : 'POST', data })}
        />
      )}

      {onboardModal && (
        <StaffForm 
          type="store_manager"
          onClose={() => setOnboardModal(false)}
          onSave={(data) => onboardMutation.mutate(data)}
          loading={onboardMutation.isPending}
          stores={storeResp?.stores.map(s => ({ id: s.id, name: s.name })) || []}
        />
      )}
    </div>
  );
};

export default Stores;
