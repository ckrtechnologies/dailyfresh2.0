import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Layout, Image as ImageIcon, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { BannerForm, HomeSectionForm } from '../components/modals/EntityForms';

const HomeManagement = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('banners');
  const [modal, setModal] = useState({ show: false, type: null, data: null });

  // --- DATA FETCHING ---
  const { data: bannerResp, isLoading: bannersLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/banners');
      return resp.data.data.banners;
    },
    enabled: activeTab === 'banners'
  });

  const { data: sectionResp, isLoading: sectionsLoading } = useQuery({
    queryKey: ['admin-home-sections'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/home-sections');
      return resp.data.data.sections;
    }
  });

  // --- MUTATIONS ---
  const mutation = useMutation({
    mutationFn: async ({ type, method, id, data }) => {
      const url = `/admin/${type}${id ? `/${id}` : ''}`;
      let payload = data;

      // Use FormData for banners (images)
      if (type === 'banners' && !(data instanceof FormData)) {
        payload = new FormData();
        Object.keys(data).forEach(key => {
          if (key === 'imageFile') {
            if (data[key]) payload.append('image', data[key]);
          } else if (data[key] !== undefined && data[key] !== null) {
            payload.append(key, data[key]);
          }
        });
      }

      return method === 'DELETE' 
        ? apiClient.delete(url) 
        : (id ? apiClient.patch(url, payload) : apiClient.post(url, payload));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries([`admin-${variables.type}`]);
      setModal({ show: false, type: null, data: null });
    }
  });

  const handleDelete = (type, id) => {
    if (window.confirm(`Are you sure you want to delete this ${type === 'banners' ? 'banner' : 'section'}?`)) {
      mutation.mutate({ type, method: 'DELETE', id });
    }
  };

  const columns = {
    banners: [
      { 
        header: 'Preview', 
        accessor: 'image_url', 
        render: (row) => (
          <div style={{ width: '80px', height: '40px', borderRadius: '4px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid var(--border)' }}>
            <img src={row.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )
      },
      { header: 'Title', accessor: 'title', render: (row) => <span style={{ fontWeight: '600' }}>{row.title}</span> },
      { header: 'Placement', accessor: 'placement', render: (row) => <span className="badge badge-pending" style={{ textTransform: 'capitalize' }}>{row.placement.replace('_', ' ')}</span> },
      { header: 'Order', accessor: 'display_order', align: 'center' },
      { 
        header: 'Status', 
        accessor: 'is_active', 
        align: 'center',
        render: (row) => row.is_active ? <CheckCircle size={16} color="var(--primary)" /> : <XCircle size={16} color="var(--danger)" />
      },
      { 
        header: 'Actions', 
        accessor: 'id', 
        align: 'center', 
        render: (row) => (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => setModal({ show: true, type: 'banners', data: row })} className="btn-icon"><Pencil size={12} /></button>
            <button onClick={() => handleDelete('banners', row.id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
          </div>
        )
      }
    ],
    sections: [
      { header: 'Section Type', accessor: 'section_type', render: (row) => <code style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold' }}>{row.section_type}</code> },
      { header: 'Display Title', accessor: 'title', render: (row) => <span style={{ fontWeight: '600' }}>{row.title || 'N/A'}</span> },
      { header: 'Subtitle', accessor: 'subtitle', render: (row) => <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.subtitle || '-'}</span> },
      { header: 'Order', accessor: 'display_order', align: 'center' },
      { 
        header: 'Status', 
        accessor: 'is_active', 
        align: 'center',
        render: (row) => row.is_active ? <span className="badge badge-success">Active</span> : <span className="badge badge-failed">Disabled</span>
      },
      { 
        header: 'Actions', 
        accessor: 'id', 
        align: 'center', 
        render: (row) => (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => setModal({ show: true, type: 'home-sections', data: row })} className="btn-icon"><Pencil size={12} /></button>
          </div>
        )
      }
    ]
  };

  if (!isAdmin) return <div style={{ padding: '40px', textAlign: 'center' }}>Access Denied</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Home Screen Management</h1>
          <p>Configure banners and layout sections for the mobile app</p>
        </div>
        {activeTab === 'banners' && (
          <div className="page-actions">
            <button onClick={() => setModal({ show: true, type: 'banners', data: null })} className="btn-compact" style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={14} /> Add Banner
            </button>
          </div>
        )}
      </div>

      <div className="tab-container">
        <button onClick={() => setActiveTab('banners')} className={`tab-item ${activeTab === 'banners' ? 'active' : ''}`}>
          <ImageIcon size={14} /> Banners
        </button>
        <button onClick={() => setActiveTab('sections')} className={`tab-item ${activeTab === 'sections' ? 'active' : ''}`}>
          <Layout size={14} /> Layout Sections
        </button>
      </div>

      <DataTable 
        title={activeTab === 'banners' ? 'App Banners' : 'Home Screen Sections'} 
        columns={columns[activeTab === 'banners' ? 'banners' : 'sections']} 
        data={activeTab === 'banners' ? bannerResp || [] : sectionResp || []} 
        loading={bannersLoading || sectionsLoading} 
      />

      {modal.show && modal.type === 'banners' && (
        <BannerForm 
          initialData={modal.data} 
          onClose={() => setModal({ show: false, type: null, data: null })}
          loading={mutation.isPending}
          onSave={(data) => mutation.mutate({ type: 'banners', id: modal.data?.id, method: modal.data ? 'PATCH' : 'POST', data })} 
        />
      )}

      {modal.show && modal.type === 'home-sections' && (
        <HomeSectionForm 
          initialData={modal.data} 
          onClose={() => setModal({ show: false, type: null, data: null })}
          loading={mutation.isPending}
          onSave={(data) => mutation.mutate({ type: 'home-sections', id: modal.data?.id, method: 'PATCH', data })} 
        />
      )}
    </div>
  );
};

export default HomeManagement;
