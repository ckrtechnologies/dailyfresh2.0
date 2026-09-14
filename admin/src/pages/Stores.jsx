import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Pencil, Trash2, Store, UserPlus, AlertTriangle, 
  X, Check, Copy, Package, ShoppingCart, Bike, PowerOff 
} from 'lucide-react';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';
import { StoreForm, StaffForm } from '../components/modals/EntityForms';

const Stores = () => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useFilters();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
  const [modal, setModal] = useState({ show: false, data: null });
  const [onboardModal, setOnboardModal] = useState(false);
  const [errorDialog, setErrorDialog] = useState(null);
  const [copied, setCopied] = useState(false);

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
    onSuccess: (resp, variables) => {
      queryClient.invalidateQueries(['stores']);
      setModal({ show: false, data: null });
      setErrorDialog(null);
      if (variables?.data && 'is_active' in variables.data) {
        alert(`Store status successfully updated to ${variables.data.is_active ? 'Active' : 'Closed'}`);
      } else if (variables?.method === 'DELETE') {
        alert('Store deleted successfully!');
      }
    },
    onError: (err) => {
      const respData = err.response?.data;
      const message = respData?.message || err.message || 'Action failed';
      const data = respData?.data;

      setErrorDialog({
        title: data?.dependencies ? 'Cannot Delete Store' : 'Operation Failed',
        message,
        data,
      });
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

      {/* Actionable Error & Dependency Dialog */}
      {errorDialog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '560px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            border: '1px solid #fee2e2'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              background: '#fef2f2',
              borderBottom: '1px solid #fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626'
                }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#991b1b' }}>
                    {errorDialog.title}
                  </h3>
                  {errorDialog.data?.storeName && (
                    <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: '500' }}>
                      {errorDialog.data.storeName}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setErrorDialog(null)}
                className="btn-icon"
                style={{ background: 'transparent', color: '#991b1b', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              <p style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#334155',
                margin: '0 0 16px 0'
              }}>
                {errorDialog.message}
              </p>

              {/* Dependency Breakdown Cards */}
              {errorDialog.data?.dependencies && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    Active Store Dependencies
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#2563eb', marginBottom: '4px' }}>
                        <Package size={16} />
                        <span style={{ fontSize: '16px', fontWeight: '700' }}>{errorDialog.data.dependencies.products || 0}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Products</div>
                    </div>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#d97706', marginBottom: '4px' }}>
                        <ShoppingCart size={16} />
                        <span style={{ fontSize: '16px', fontWeight: '700' }}>{errorDialog.data.dependencies.orders || 0}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Orders</div>
                    </div>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#059669', marginBottom: '4px' }}>
                        <Bike size={16} />
                        <span style={{ fontSize: '16px', fontWeight: '700' }}>{errorDialog.data.dependencies.riders || 0}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Riders</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {errorDialog.data?.canDeactivate && errorDialog.data?.isActive && (
                  <button
                    onClick={() => {
                      const storeId = errorDialog.data.storeId;
                      setErrorDialog(null);
                      mutation.mutate({ method: 'PATCH', id: storeId, data: { is_active: false } });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '11px 16px',
                      borderRadius: '8px',
                      background: '#f59e0b',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <PowerOff size={16} />
                    Deactivate Store Instead (Mark Closed)
                  </button>
                )}

                {errorDialog.data?.dependencies?.products > 0 && (
                  <button
                    onClick={() => {
                      setErrorDialog(null);
                      navigate('/inventory');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '11px 16px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      color: '#334155',
                      fontWeight: '600',
                      fontSize: '13px',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer'
                    }}
                  >
                    <Package size={16} />
                    Go to Inventory to Manage/Delete Products
                  </button>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    onClick={() => {
                      const details = `Store Deletion Error Report:\nStore: ${errorDialog.data?.storeName || 'N/A'} (ID: ${errorDialog.data?.storeId || 'N/A'})\nError: ${errorDialog.message}\nProducts: ${errorDialog.data?.dependencies?.products ?? 0}, Orders: ${errorDialog.data?.dependencies?.orders ?? 0}, Riders: ${errorDialog.data?.dependencies?.riders ?? 0}`;
                      navigator.clipboard.writeText(details);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                    {copied ? 'Copied to Clipboard!' : 'Copy Error Details to Report'}
                  </button>
                  <button
                    onClick={() => setErrorDialog(null)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stores;
