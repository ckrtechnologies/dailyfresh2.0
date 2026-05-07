import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';

const SLOT_TYPES = [
  { value: 'tomorrow_morning', label: 'Tomorrow Morning' },
  { value: 'tomorrow_evening', label: 'Tomorrow Evening' },
];

const fmt = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const emptyForm = { type: 'tomorrow_morning', slot_name: '', start_time: '', end_time: '', display_order: 0, is_active: true };

const DeliverySlots = () => {
  const queryClient = useQueryClient();
  const { searchQuery, setSearchQuery } = useFilters();
  const [activeTab, setActiveTab] = useState('tomorrow_morning');
  const [modal, setModal] = useState({ open: false, data: null });
  const [form, setForm] = useState(emptyForm);

  // Fetch all slots
  const { data: resp, isLoading } = useQuery({
    queryKey: ['admin-delivery-slots', searchQuery],
    queryFn: async () => {
      const res = await apiClient.get('/admin/delivery-slots', {
        params: { search: searchQuery || undefined },
      });
      return res.data.data;
    },
  });

  const slots = (resp?.slots || []).filter(s => s.type === activeTab);

  // Create
  const createMutation = useMutation({
    mutationFn: (body) => apiClient.post('/admin/delivery-slots', body),
    onSuccess: () => { queryClient.invalidateQueries(['admin-delivery-slots']); closeModal(); },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => apiClient.patch(`/admin/delivery-slots/${id}`, body),
    onSuccess: () => { queryClient.invalidateQueries(['admin-delivery-slots']); closeModal(); },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/delivery-slots/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['admin-delivery-slots']),
  });

  // Toggle active
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => apiClient.patch(`/admin/delivery-slots/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries(['admin-delivery-slots']),
  });

  const openCreate = () => {
    setForm({ ...emptyForm, type: activeTab });
    setModal({ open: true, data: null });
  };

  const openEdit = (slot) => {
    setForm({ ...slot });
    setModal({ open: true, data: slot });
  };

  const closeModal = () => setModal({ open: false, data: null });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modal.data) {
      updateMutation.mutate({ id: modal.data.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const columns = [
    {
      key: 'slot_name',
      label: 'Slot Name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} style={{ color: row.type === 'tomorrow_morning' ? '#10B981' : '#6366F1' }} />
          <span style={{ fontWeight: 600 }}>{row.slot_name}</span>
        </div>
      ),
    },
    {
      key: 'start_time',
      label: 'Start',
      render: (row) => fmt(row.start_time),
    },
    {
      key: 'end_time',
      label: 'End',
      render: (row) => fmt(row.end_time),
    },
    {
      key: 'display_order',
      label: 'Order',
      render: (row) => <span style={{ color: 'var(--text-muted)' }}>{row.display_order}</span>,
    },
    {
      key: 'is_active',
      label: 'Active',
      render: (row) => (
        <button
          onClick={() => toggleMutation.mutate({ id: row.id, is_active: !row.is_active })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {row.is_active
            ? <ToggleRight size={24} color="#10B981" />
            : <ToggleLeft size={24} color="#9CA3AF" />}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => openEdit(row)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => { if (window.confirm('Delete this slot?')) deleteMutation.mutate(row.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>Delivery Time Windows</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Manage the time slots customers can choose for scheduled deliveries.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700,
          }}
        >
          <Plus size={16} /> Add Time Window
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {SLOT_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: activeTab === t.value ? '2px solid var(--primary)' : '2px solid var(--border)',
              background: activeTab === t.value ? 'var(--primary)' : 'transparent',
              color: activeTab === t.value ? '#fff' : 'var(--text-main)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {t.label}
            <span style={{
              marginLeft: 8, background: activeTab === t.value ? 'rgba(255,255,255,0.2)' : 'var(--border)',
              borderRadius: 10, padding: '1px 8px', fontSize: 11,
            }}>
              {(resp?.slots || []).filter(s => s.type === t.value).length}
            </span>
          </button>
        ))}
      </div>

      <DataTable
        title={activeTab === 'tomorrow_morning' ? 'Tomorrow Morning Slots' : 'Tomorrow Evening Slots'}
        columns={columns}
        data={slots}
        loading={isLoading}
        pagination={{ total: slots.length, page: 1, pageSize: 50 }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search slots..."
      />

      {/* Create / Edit Modal */}
      {modal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 32, width: 440,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
              {modal.data ? 'Edit Time Window' : 'New Time Window'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Parent Type */}
              <label style={{ display: 'block', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Delivery Bucket
                </span>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                >
                  {SLOT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>

              {/* Slot Name */}
              <label style={{ display: 'block', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Slot Name
                </span>
                <input
                  required
                  type="text"
                  placeholder="e.g. 9 AM – 10 AM"
                  value={form.slot_name}
                  onChange={e => setForm(f => ({ ...f, slot_name: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box' }}
                />
              </label>

              {/* Times */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <label>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start Time</span>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                  />
                </label>
                <label>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>End Time</span>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                    style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                  />
                </label>
              </div>

              {/* Display Order */}
              <label style={{ display: 'block', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Display Order</span>
                <input
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))}
                  style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box' }}
                />
              </label>

              {/* Active */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Active (visible to customers)</span>
              </label>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal}
                  style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                  {modal.data ? 'Save Changes' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliverySlots;
