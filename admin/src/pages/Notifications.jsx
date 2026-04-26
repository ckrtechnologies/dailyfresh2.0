import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, History, CheckCircle2, AlertCircle, Loader2, 
  Users, User, Radio, Hash, Trash2, Search, Filter, Download,
  Eye, Settings
} from 'lucide-react';
import apiClient from '../services/api.js';
import { format } from 'date-fns';

const Notifications = () => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    targetType: 'role', // user, role, all, topic
    targetValue: 'customer',
    type: 'promo',
    link: '',
    image_url: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.get('/admin/notifications');
      if (res.data.success) {
        setHistory(res.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notification history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
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
      await apiClient.post('/admin/notifications/send', payload);
      setStatus({ type: 'success', message: 'Notification(s) sent successfully!' });
      setFormData({ 
        ...formData,
        title: '', 
        body: '', 
        link: '',
        image_url: ''
      });
      fetchHistory(); // Refresh history
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to send notification.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Render S.No based on pagination formula: (page_number - 1) * page_size + row_index + 1
  const getSNo = (index) => (currentPage - 1) * pageSize + index + 1;

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
              border: `1px solid ${status.type === 'success' ? '#16a34a' : '#ef4444'}`,
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
                        color: formData.targetType === t.id ? 'white' : 'var(--text)',
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
                ) : (
                  <input 
                    className="form-control"
                    placeholder={formData.targetType === 'user' ? "Enter User ID" : "Enter Topic Name"}
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
              disabled={loading}
              type="submit"
              className="btn-compact"
              style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                height: '44px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? 'Sending to Cloud...' : 'Dispatch Notification'}
            </button>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="glass-panel" style={{ padding: '24px', background: '#f8fafc' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={16} /> Device Preview
          </h3>
          
          <div style={{ position: 'relative', width: '280px', height: '560px', background: '#1e293b', borderRadius: '32px', margin: '0 auto', border: '6px solid #0f172a', overflow: 'hidden' }}>
            <div style={{ width: '80px', height: '20px', background: '#0f172a', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', zIndex: 10 }}></div>
            
            <div style={{ padding: '40px 16px' }}>
              <div style={{ 
                background: 'rgba(255,255,255,0.95)', 
                backdropFilter: 'blur(10px)',
                borderRadius: '16px', 
                padding: '12px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                animation: 'slideIn 0.3s ease-out'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                    <Bell size={10} color="white" />
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>DAILY FRESH</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 'auto' }}>now</span>
                </div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>{formData.title || 'Notification Title'}</p>
                <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{formData.body || 'Type your message to see a preview of how it appears on mobile devices...'}</p>
                {formData.image_url && (
                  <div style={{ marginTop: '8px', width: '100%', height: '120px', borderRadius: '8px', background: '#eee', overflow: 'hidden' }}>
                    <img src={formData.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                  </div>
                )}
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }}></div>
          </div>
        </div>
      </div>

      {/* History Table (Standard Data Table) */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="var(--primary)" /> Sent History
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                placeholder="Search history..." 
                className="form-control"
                style={{ paddingLeft: '32px', width: '250px', height: '36px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn-compact" style={{ height: '36px', background: '#f1f5f9', border: '1px solid var(--border)' }}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center', position: 'sticky', left: 0, background: 'var(--bg-light)', zIndex: 1 }}>S.No</th>
                <th style={{ textAlign: 'left' }}>Recipients</th>
                <th style={{ textAlign: 'left' }}>Title</th>
                <th style={{ textAlign: 'left' }}>Message</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Type</th>
                <th style={{ width: '160px', textAlign: 'center' }}>Sent At</th>
                <th style={{ width: '140px', textAlign: 'center', position: 'sticky', right: 0, background: 'var(--bg-light)', zIndex: 1 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} style={{ height: '44px' }}>
                      <div className="skeleton" style={{ height: '20px', margin: '0 10px' }}></div>
                    </td>
                  </tr>
                ))
              ) : paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ height: '200px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Bell size={48} opacity={0.2} />
                      <p>No notifications found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)', position: 'sticky', left: 0, background: 'white' }}>
                      {getSNo(index)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{item.profile?.full_name || 'Broadcast'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.profile?.role || 'Global'}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{item.title}</td>
                    <td style={{ maxWidth: '300px' }}>
                      <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, fontSize: '13px' }}>
                        {item.body}
                      </p>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge badge-${item.type === 'promo' ? 'success' : item.type === 'system' ? 'danger' : 'info'}`}>
                        {item.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {format(new Date(item.created_at), 'dd MMM yyyy, hh:mm a')}
                    </td>
                    <td style={{ textAlign: 'center', position: 'sticky', right: 0, background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button className="action-btn" title="View Details">
                          <Eye size={14} />
                        </button>
                        <button className="action-btn" title="Resend">
                          <Send size={14} />
                        </button>
                        <button className="action-btn text-danger" title="Delete Log">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Pagination Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing {Math.min(filteredHistory.length, (currentPage - 1) * pageSize + 1)}–{Math.min(filteredHistory.length, currentPage * pageSize)} of {filteredHistory.length} records
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select className="form-control" style={{ width: '70px', height: '32px', padding: '0 4px', fontSize: '12px' }}>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="500">500</option>
            </select>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="btn-compact" 
                style={{ background: 'white', padding: '4px 12px', border: '1px solid var(--border)', fontSize: '12px' }}
              >
                Prev
              </button>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="btn-compact" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 12px', fontSize: '12px' }}>{currentPage}</button>
              </div>
              <button 
                disabled={currentPage * pageSize >= filteredHistory.length}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="btn-compact" 
                style={{ background: 'white', padding: '4px 12px', border: '1px solid var(--border)', fontSize: '12px' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .data-table th {
          background: #f8fafc;
          padding: 12px 16px;
          font-weight: 600;
          font-size: 13px;
          color: #64748b;
          border-bottom: 1px solid var(--border);
        }
        .data-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }
        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: white;
          display: flex;
          alignItems: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }
        .action-btn:hover { background: #f8fafc; border-color: var(--primary); color: var(--primary); }
        .action-btn.text-danger:hover { color: #ef4444; border-color: #ef4444; }
        .badge {
          padding: 4px 8px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
        }
        .badge-success { background: #f0fdf4; color: #16a34a; }
        .badge-danger { background: #fef2f2; color: #ef4444; }
        .badge-info { background: #eff6ff; color: #3b82f6; }
      `}} />
    </div>
  );
};

export default Notifications;
