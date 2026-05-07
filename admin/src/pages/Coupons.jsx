import React, { useState } from 'react';
import { 
  Ticket, Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle, Loader2, X 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api.js';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';

const Coupons = () => {
  const queryClient = useQueryClient();
  const { searchQuery, setSearchQuery } = useFilters();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
  const [status, setStatus] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    end_date: '',
    usage_limit: '',
    is_active: true
  });

  // Fetch Coupons
  const { data: response, isLoading } = useQuery({
    queryKey: ['coupons', pagination, searchQuery],
    queryFn: async () => {
      const res = await apiClient.get('/admin/coupons', {
        params: { ...pagination, search: searchQuery || undefined }
      });
      return res.data.data;
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/coupons', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coupons']);
      setIsModalOpen(false);
      resetForm();
      setStatus({ type: 'success', message: 'Coupon created successfully!' });
    },
    onError: (err) => setStatus({ type: 'error', message: err.response?.data?.message || 'Error creating coupon' })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.patch(`/admin/coupons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coupons']);
      setIsModalOpen(false);
      resetForm();
      setStatus({ type: 'success', message: 'Coupon updated successfully!' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/coupons/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['coupons'])
  });

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount_amount: '',
      end_date: '',
      usage_limit: '',
      is_active: true
    });
    setEditingCoupon(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    { 
        header: 'Coupon Code', 
        accessor: 'code',
        render: (row) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '4px 8px', background: '#f0fdf4', border: '1px dashed #22c55e', borderRadius: '4px', fontWeight: '700', fontSize: '12px', color: '#166534' }}>
                    {row.code}
                </div>
            </div>
        )
    },
    { header: 'Discount', accessor: (row) => row.discount_type === 'percentage' ? `${row.discount_value}%` : `₹${row.discount_value}` },
    { header: 'Min Order', accessor: (row) => `₹${row.min_order_amount}` },
    { header: 'Used', accessor: (row) => `${row.used_count}${row.usage_limit ? ` / ${row.usage_limit}` : ''}` },
    { 
      header: 'Expiry', 
      accessor: (row) => row.end_date ? new Date(row.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Expiry' 
    },
    { 
      header: 'Status', 
      accessor: 'is_active',
      align: 'center',
      render: (row) => (
        <span className={`badge badge-${row.is_active ? 'active' : 'failed'}`}>
          {row.is_active ? 'ACTIVE' : 'INACTIVE'}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button className="btn-icon" onClick={() => {
            setEditingCoupon(row);
            setFormData({
              code: row.code,
              description: row.description || '',
              discount_type: row.discount_type,
              discount_value: row.discount_value,
              min_order_amount: row.min_order_amount,
              max_discount_amount: row.max_discount_amount || '',
              end_date: row.end_date ? row.end_date.slice(0, 10) : '',
              usage_limit: row.usage_limit || '',
              is_active: row.is_active
            });
            setIsModalOpen(true);
          }}><Edit2 size={14} /></button>
          <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => {
            if(window.confirm('Delete this coupon?')) deleteMutation.mutate(row.id);
          }}><Trash2 size={14} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Coupons & Promotions</h1>
          <p>Manage discount codes and marketing offers</p>
        </div>
        <button className="btn-compact" style={{ background: 'var(--primary)', color: 'white', gap: '8px' }} onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {status && (
        <div style={{ 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          fontSize: '13px',
          background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: status.type === 'success' ? '#166534' : '#991b1b'
        }}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{status.message}</span>
          <X size={16} style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setStatus(null)} />
        </div>
      )}

      <DataTable 
        columns={columns}
        data={response?.coupons || []}
        loading={isLoading}
        pagination={response?.pagination || pagination}
        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '500px', padding: '24px', position: 'relative' }}>
            <button style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Ticket size={20} color="var(--primary)" /> {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>COUPON CODE</label>
                <input 
                  required
                  className="form-control"
                  style={{ textTransform: 'uppercase', fontWeight: '700' }}
                  placeholder="e.g. WELCOME50"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="form-group">
                <label>DESCRIPTION</label>
                <input 
                  className="form-control"
                  placeholder="e.g. 20% off on your first order"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>DISCOUNT TYPE</label>
                  <select 
                    className="form-control"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>DISCOUNT VALUE</label>
                  <input 
                    required
                    type="number"
                    className="form-control"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>MIN ORDER AMOUNT</label>
                  <input 
                    type="number"
                    className="form-control"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({...formData, min_order_amount: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>MAX DISCOUNT (FOR %)</label>
                  <input 
                    type="number"
                    disabled={formData.discount_type === 'fixed'}
                    className="form-control"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({...formData, max_discount_amount: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>EXPIRY DATE</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>USAGE LIMIT</label>
                  <input 
                    type="number"
                    placeholder="Unlimited"
                    className="form-control"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input 
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                <label style={{ fontSize: '13px', margin: 0 }}>Active and visible to customers</label>
              </div>

              <button 
                type="submit" 
                className="btn-compact" 
                style={{ background: 'var(--primary)', color: 'white', width: '100%', height: '44px', marginTop: '10px' }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin" /> : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
      `}</style>
    </div>
  );
};

export default Coupons;
