import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext, useLocation } from 'react-router-dom';
import { 
  UserPlus, 
  Eye, 
  Pencil, 
  Trash2, 
  X, 
  MapPin, 
  ShoppingBag, 
  CreditCard, 
  Calendar, 
  Phone, 
  Mail, 
  Shield, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';

const Customers = ({ storeId: propStoreId, dateRange: propDateRange, searchQuery: propSearchQuery } = {}) => {
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
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [viewCustomerId, setViewCustomerId] = useState(null);

  useEffect(() => {
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

  // List Customers Query
  const { data: response, isLoading } = useQuery({
    queryKey: ['customers', pagination, searchQuery, globalStoreId, dateRange],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/customers', {
        params: { 
          ...pagination, 
          search: searchQuery || undefined,
          store_id: globalStoreId || undefined,
          startDate: dateRange?.startDate || undefined,
          endDate: dateRange?.endDate || undefined
        }
      });
      return resp.data.data;
    }
  });

  // Create Customer Mutation
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setIsCreateModalOpen(false);
      alert('Customer created successfully!');
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to create customer')
  });

  // Update Customer Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.patch(`/admin/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      if (viewCustomerId) queryClient.invalidateQueries(['customer-details', viewCustomerId]);
      setEditCustomer(null);
      alert('Customer updated successfully!');
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to update customer')
  });

  // Quick Toggle Active Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => apiClient.patch(`/admin/customers/${id}`, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      if (viewCustomerId) queryClient.invalidateQueries(['customer-details', viewCustomerId]);
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to change status')
  });

  // Delete Customer Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/customers/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['customers']);
      const msg = res.data?.message || 'Customer deleted successfully';
      alert(msg);
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to delete customer')
  });

  const handleDelete = (customer) => {
    const name = customer.full_name || customer.fullName || customer.email;
    if (window.confirm(`Are you sure you want to remove customer "${name}"?\n(If this customer has existing orders, the account will be safely deactivated to protect financial history)`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  const formatJoinedDate = (row) => {
    const dateVal = row.created_at || row.createdAt;
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const columns = [
    {
      header: 'Full Name',
      accessor: (row) => row.full_name || row.fullName || 'N/A',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={row.avatar_url || row.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.full_name || 'User')}`} 
            alt="Avatar" 
            style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f1f5f9' }} 
          />
          <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{row.full_name || row.fullName || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Email',
      accessor: (row) => row.email
    },
    {
      header: 'Phone',
      accessor: (row) => row.phone || 'N/A'
    },
    {
      header: 'Is Active',
      accessor: (row) => (row.is_active ?? row.isActive),
      align: 'center',
      render: (row) => {
        const isActive = Boolean(row.is_active ?? row.isActive);
        return (
          <button
            type="button"
            onClick={() => toggleStatusMutation.mutate({ id: row.id, isActive: !isActive })}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '12px',
              transition: 'transform 0.15s ease'
            }}
            title={`Click to ${isActive ? 'Deactivate' : 'Activate'}`}
          >
            <span className={`badge badge-${isActive ? 'active' : 'failed'}`}>
              {isActive ? 'Active' : 'Disabled'}
            </span>
          </button>
        );
      }
    },
    {
      header: 'Joined On',
      accessor: formatJoinedDate,
      align: 'center'
    },
    {
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          <button 
            type="button"
            onClick={() => setViewCustomerId(row.id)} 
            className="btn-icon" 
            title="View Customer Profile & Orders"
            style={{ color: 'var(--primary)', background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            <Eye size={13} />
          </button>
          <button 
            type="button"
            onClick={() => setEditCustomer(row)} 
            className="btn-icon" 
            title="Edit Customer"
            style={{ color: '#475569', background: '#f8fafc', border: '1px solid var(--border)' }}
          >
            <Pencil size={13} />
          </button>
          <button 
            type="button"
            onClick={() => handleDelete(row)} 
            className="btn-icon" 
            title="Delete / Deactivate Customer"
            style={{ color: 'var(--danger)', background: '#fef2f2', border: '1px solid #fecaca' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Customers</h1>
          <p>View, onboard, and manage registered customers and their delivery details</p>
        </div>
        <div className="page-actions">
          <button
            className="btn-compact"
            onClick={() => setIsCreateModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: 'white', border: 'none' }}
          >
            <UserPlus size={14} /> Add Customer
          </button>
        </div>
      </div>

      <DataTable
        title="Customers"
        columns={columns}
        data={response?.customers || []}
        loading={isLoading}
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: response?.total ?? response?.pagination?.total ?? 0
        }}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) => setPagination({ page: 1, pageSize })}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Add Customer Modal */}
      {isCreateModalOpen && (
        <CustomerFormModal
          title="Add New Customer"
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(formData) => createMutation.mutate(formData)}
          loading={createMutation.isPending}
        />
      )}

      {/* Edit Customer Modal */}
      {editCustomer && (
        <CustomerFormModal
          title="Edit Customer"
          initialData={editCustomer}
          onClose={() => setEditCustomer(null)}
          onSubmit={(formData) => updateMutation.mutate({ id: editCustomer.id, data: formData })}
          loading={updateMutation.isPending}
        />
      )}

      {/* View Customer Details Modal */}
      {viewCustomerId && (
        <CustomerDetailsModal
          customerId={viewCustomerId}
          onClose={() => setViewCustomerId(null)}
          onEdit={() => {
            const customer = response?.customers?.find(c => c.id === viewCustomerId);
            if (customer) {
              setViewCustomerId(null);
              setEditCustomer(customer);
            }
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// CUSTOMER FORM MODAL (CREATE & EDIT)
// ============================================================
const CustomerFormModal = ({ title, initialData = null, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    password: '',
    is_active: initialData ? Boolean(initialData.is_active ?? initialData.isActive) : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (initialData && !payload.password) {
      delete payload.password;
    }
    onSubmit(payload);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      zIndex: 1000
    }}>
      <div className="glass-panel animate-slide-in-right" style={{
        width: '100%',
        maxWidth: '520px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden',
        boxShadow: '-10px 0 50px -12px rgba(0, 0, 0, 0.5)',
        background: 'white',
        borderRadius: 0
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white'
        }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{title}</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {initialData ? 'Update customer profile information' : 'Register a new customer account'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-icon" style={{ background: '#f1f5f9' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                Full Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. John Doe"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', background: 'white' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                Email Address <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@example.com"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', background: 'white' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', background: 'white' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                {initialData ? 'Reset Password (optional)' : 'Password'}
              </label>
              <input
                type="password"
                required={!initialData}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={initialData ? 'Leave blank to keep current' : 'Min 6 characters'}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', background: 'white' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="is_active" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer', margin: 0 }}>
                Active Account (allow login & orders)
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// CUSTOMER DETAILS MODAL (PROFILE, ADDRESSES, ORDER STATS)
// ============================================================
const CustomerDetailsModal = ({ customerId, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-details', customerId],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/customers/${customerId}`);
      return res.data.data;
    }
  });

  const customer = data?.customer;
  const addresses = data?.addresses || [];
  const orders = data?.orders || [];
  const stats = data?.stats || { totalOrders: 0, totalSpent: 0, lastOrderDate: null };

  const formatJoined = (d) => {
    if (!d) return 'N/A';
    const dateObj = new Date(d);
    return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 1000
    }}>
      <div className="glass-panel animate-slide-in-right" style={{
        width: '100%',
        maxWidth: '750px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden',
        boxShadow: '-10px 0 50px -12px rgba(0, 0, 0, 0.5)',
        background: 'white',
        borderRadius: 0
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src={customer?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customer?.full_name || 'Customer')}`} 
              alt="Avatar" 
              style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#f1f5f9', border: '1px solid var(--border)' }} 
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  {customer?.full_name || customer?.fullName || 'Customer Details'}
                </h2>
                {customer && (
                  <span className={`badge badge-${customer.is_active ? 'active' : 'failed'}`}>
                    {customer.is_active ? 'Active' : 'Disabled'}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Customer ID: {customerId}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              onClick={onEdit} 
              className="btn-compact" 
              style={{ background: '#f1f5f9', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Pencil size={13} /> Edit
            </button>
            <button type="button" onClick={onClose} className="btn-icon" style={{ background: '#f1f5f9' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ padding: '0 24px', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', gap: '20px' }}>
          {[
            { id: 'overview', label: 'Overview & Stats', icon: ShoppingBag },
            { id: 'addresses', label: `Saved Addresses (${addresses.length})`, icon: MapPin },
            { id: 'orders', label: `Recent Orders (${orders.length})`, icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 0',
                fontSize: '13px',
                fontWeight: '600',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                background: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--primary)' : 'transparent'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', background: '#f8fafc', flex: 1 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading customer data...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>Failed to load customer details</div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & STATS */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* KPI Stats Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                        <span>TOTAL ORDERS</span>
                        <ShoppingBag size={16} color="var(--primary)" />
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: 'var(--text-main)' }}>
                        {stats.totalOrders}
                      </div>
                    </div>

                    <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                        <span>TOTAL SPENT</span>
                        <CreditCard size={16} color="#10B981" />
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: '#10B981' }}>
                        ₹{Number(stats.totalSpent).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                        <span>LAST ORDER</span>
                        <Calendar size={16} color="#8B5CF6" />
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '700', marginTop: '12px', color: 'var(--text-main)' }}>
                        {stats.lastOrderDate ? formatJoined(stats.lastOrderDate) : 'Never'}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Card */}
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 14px 0', color: 'var(--text-main)' }}>Account Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={16} color="var(--text-muted)" />
                        <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{customer?.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={16} color="var(--text-muted)" />
                        <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{customer?.phone || 'Not provided'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="var(--text-muted)" />
                        <span style={{ color: 'var(--text-muted)' }}>Member Since:</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{formatJoined(customer?.created_at)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={16} color="var(--text-muted)" />
                        <span style={{ color: 'var(--text-muted)' }}>Provider:</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{customer?.auth_provider || 'local'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SAVED ADDRESSES */}
              {activeTab === 'addresses' && (
                <div>
                  {addresses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', background: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <MapPin size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px auto' }} />
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>No delivery addresses saved by this customer yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {addresses.map((addr) => (
                        <div key={addr.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{addr.label || 'Address'}</span>
                              {addr.isDefault && (
                                <span style={{ fontSize: '10px', background: '#e0e7ff', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PIN: {addr.pincode}</span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: '0 0 4px 0', lineHeight: 1.4 }}>
                            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                            {addr.city}, {addr.state} • Contact: {addr.fullName || customer?.full_name} ({addr.phone || customer?.phone})
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RECENT ORDERS */}
              {activeTab === 'orders' && (
                <div>
                  {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', background: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <ShoppingBag size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px auto' }} />
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>No orders placed by this customer yet.</p>
                    </div>
                  ) : (
                    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '10px 14px' }}>Order #</th>
                            <th style={{ padding: '10px 14px' }}>Date</th>
                            <th style={{ padding: '10px 14px' }}>Total Amount</th>
                            <th style={{ padding: '10px 14px' }}>Status</th>
                            <th style={{ padding: '10px 14px' }}>Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--primary)' }}>
                                {order.orderNumber || order.order_number || order.id.slice(0, 8)}
                              </td>
                              <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                                {formatJoined(order.created_at || order.createdAt)}
                              </td>
                              <td style={{ padding: '10px 14px', fontWeight: '700', color: 'var(--text-main)' }}>
                                ₹{Number(order.totalAmount || order.total_amount || 0).toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span className={`badge badge-${(order.status === 'delivered' || order.status === 'completed') ? 'active' : 'pending'}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ textTransform: 'capitalize', fontSize: '12px', color: order.paymentStatus === 'completed' ? '#10B981' : '#F59E0B' }}>
                                  {order.paymentStatus || order.payment_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers;
