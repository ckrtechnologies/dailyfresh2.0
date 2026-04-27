import React, { useState } from 'react';
import { 
  Bell, Send, History, CheckCircle2, AlertCircle, Loader2, 
  Users, User, Radio, Hash, Eye, Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api.js';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';

const UserSelector = ({ onSelect, currentValue }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchUsers = async (val) => {
    setSearch(val);
    if (val.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get('/admin/customers', { params: { search: val, pageSize: 5 } });
      setResults(res.data.data.customers || []);
      setShowDropdown(true);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input 
        className="form-control"
        placeholder="Search Name/Email/Phone..."
        value={search || currentValue}
        onChange={(e) => searchUsers(e.target.value)}
        onFocus={() => search.length >= 3 && setShowDropdown(true)}
      />
      {loading && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: '10px', top: '10px' }} />}
      
      {showDropdown && results.length > 0 && (
        <div className="glass-panel" style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          zIndex: 100, 
          marginTop: '4px',
          padding: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {results.map(u => (
            <div 
              key={u.id}
              onClick={() => {
                onSelect(u);
                setSearch(`${u.full_name} (${u.phone || u.email})`);
                setShowDropdown(false);
              }}
              style={{ 
                padding: '8px', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '13px',
                borderBottom: '1px solid var(--border-light)'
              }}
              className="hover-bg"
            >
              <div style={{ fontWeight: '600' }}>{u.full_name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.phone || u.email}</div>
            </div>
          ))}
        </div>
      )}
      {showDropdown && results.length === 0 && search.length >= 3 && !loading && (
        <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, padding: '8px', fontSize: '12px' }}>
          No users found
        </div>
      )}
    </div>
  );
};

const Notifications = () => {
  const queryClient = useQueryClient();
  const { searchQuery } = useFilters();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    targetType: 'role', // user, role, all, topic
    targetValue: 'customer',
    type: 'promo',
    link: '',
    image_url: ''
  });
  
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
  const [status, setStatus] = useState(null);

  // Fetch History using React Query
  const { data: response, isLoading: historyLoading } = useQuery({
    queryKey: ['notifications-history', pagination, searchQuery],
    queryFn: async () => {
      const res = await apiClient.get('/admin/notifications', {
        params: { ...pagination, search: searchQuery || undefined }
      });
      return res.data.data;
    }
  });

  // Send Notification Mutation
  const sendMutation = useMutation({
    mutationFn: async (payload) => {
      return apiClient.post('/admin/notifications/send', payload);
    },
    onSuccess: () => {
      setStatus({ type: 'success', message: 'Notification(s) sent successfully!' });
      setFormData({ 
        ...formData,
        title: '', 
        body: '', 
        link: '',
        image_url: ''
      });
      queryClient.invalidateQueries(['notifications-history']);
    },
    onError: (error) => {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to send notification.' });
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    setStatus(null);

    const payload = {
      targetType: formData.targetType,
      targetValue: formData.targetValue,
      title: formData.title,
      body: formData.body,
      data: { 
        type: formData.type,
        link: formData.link || undefined,
        image_url: formData.image_url || undefined,
        sentAt: new Date().toISOString()
      }
    };
    sendMutation.mutate(payload);
  };

  const columns = [
    { 
      header: 'Recipients', 
      accessor: (row) => row.profile?.full_name || 'Broadcast',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>{row.profile?.full_name || 'Broadcast'}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.profile?.role || row.target_value || 'Global'}</span>
        </div>
      )
    },
    { header: 'Title', accessor: 'title', render: (row) => <span style={{ fontWeight: '500' }}>{row.title}</span> },
    { 
      header: 'Message', 
      accessor: 'body',
      render: (row) => (
        <p style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, fontSize: '13px' }}>
          {row.body}
        </p>
      )
    },
    { 
      header: 'Type', 
      accessor: 'type',
      align: 'center',
      render: (row) => (
        <span className={`badge badge-${row.type === 'promo' ? 'active' : row.type === 'system' ? 'failed' : 'processing'}`}>
          {row.type.toUpperCase()}
        </span>
      )
    },
    { 
      header: 'Sent At', 
      accessor: (row) => new Date(row.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
      align: 'center'
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button className="btn-icon" title="View Details"><Eye size={14} /></button>
          <button className="btn-icon" title="Resend" onClick={() => {
            setFormData({
              ...formData,
              title: row.title,
              body: row.body,
              type: row.type,
              link: row.data?.link || '',
              image_url: row.data?.image_url || ''
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}><Send size={14} /></button>
          <button className="btn-icon" style={{ color: 'var(--danger)' }} title="Delete Log"><Trash2 size={14} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Notification Management System (NMS)</h1>
          <p>Multi-channel notifications for Mobile, Backend & Admin</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {/* Sending Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={18} color="var(--primary)" /> Send New Notification
          </h2>

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
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>TARGET TYPE</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {[
                    { id: 'user', icon: User, label: 'Single' },
                    { id: 'role', icon: Users, label: 'Role' },
                    { id: 'all', icon: Radio, label: 'All' },
                    { id: 'topic', icon: Hash, label: 'Topic' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({...formData, targetType: t.id})}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: formData.targetType === t.id ? 'var(--primary)' : 'white',
                        color: formData.targetType === t.id ? 'white' : 'var(--text-main)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      <t.icon size={14} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>TARGET VALUE</label>
                {formData.targetType === 'role' ? (
                  <select 
                    className="form-control"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                  >
                    <option value="customer">All Customers</option>
                    <option value="rider">All Riders</option>
                    <option value="store_manager">All Store Managers</option>
                  </select>
                ) : formData.targetType === 'all' ? (
                  <input className="form-control" value="Everyone" disabled />
                ) : formData.targetType === 'user' ? (
                  <UserSelector 
                    onSelect={(user) => setFormData({...formData, targetValue: user.id})} 
                    currentValue={formData.targetValue}
                  />
                ) : (
                  <input 
                    className="form-control"
                    placeholder="Enter Topic Name"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                  />
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>NOTIFICATION TYPE</label>
                <select 
                  className="form-control"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="promo">Promotion 🎁</option>
                  <option value="system">System Alert ⚠️</option>
                  <option value="order">Order Update 📦</option>
                  <option value="wallet">Wallet/Payment 💰</option>
                </select>
              </div>
              <div className="form-group">
                <label>IMAGE URL (OPTIONAL)</label>
                <input 
                  className="form-control"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>TITLE</label>
              <input 
                required
                className="form-control"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>MESSAGE CONTENT</label>
              <textarea 
                required
                className="form-control"
                rows={4}
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                style={{ resize: 'none' }}
              />
            </div>

            <div className="form-group">
              <label>DEEP LINK / REDIRECT URL</label>
              <input 
                className="form-control"
                placeholder="dailyfresh://category/fish or https://..."
                value={formData.link}
                onChange={(e) => setFormData({...formData, link: e.target.value})}
              />
            </div>

            <button 
              disabled={sendMutation.isPending}
              type="submit"
              className="btn-compact"
              style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                height: '44px',
                width: '100%',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {sendMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {sendMutation.isPending ? 'Sending to Cloud...' : 'Dispatch Notification'}
            </button>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="glass-panel" style={{ padding: '24px', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '20px', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={16} /> Device Preview
          </h3>
          
          <div style={{ position: 'relative', width: '240px', height: '480px', background: '#1e293b', borderRadius: '32px', border: '6px solid #0f172a', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <div style={{ width: '60px', height: '18px', background: '#0f172a', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', zIndex: 10 }}></div>
            
            <div style={{ padding: '32px 12px' }}>
              <div style={{ 
                background: 'rgba(255,255,255,0.95)', 
                backdropFilter: 'blur(10px)',
                borderRadius: '12px', 
                padding: '10px', 
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bell size={8} color="white" />
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b' }}>DAILY FRESH</span>
                  <span style={{ fontSize: '9px', color: '#94a3b8', marginLeft: 'auto' }}>now</span>
                </div>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>{formData.title || 'Notification Title'}</p>
                <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.3' }}>{formData.body || 'Your message will appear here...'}</p>
                {formData.image_url && (
                  <div style={{ marginTop: '6px', width: '100%', height: '100px', borderRadius: '6px', background: '#eee', overflow: 'hidden' }}>
                    <img src={formData.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                  </div>
                )}
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }}></div>
          </div>
        </div>
      </div>

      <DataTable 
        title="Notification History"
        columns={columns}
        data={response?.notifications || []}
        loading={historyLoading}
        pagination={response?.pagination || pagination}
        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
        onPageSizeChange={(ps) => setPagination({ page: 1, pageSize: ps })}
      />
    </div>
  );
};

export default Notifications;

