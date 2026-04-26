import React, { useState } from 'react';
import { User, Lock, Globe, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../services/api';

const SettingsPage = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Forms local state
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [platformForm, setPlatformForm] = useState({
    gst_rate: 0,
    free_delivery_threshold: 0,
    standard_delivery_fee: 0,
    min_order_value: 0,
    contact_support_phone: '',
    contact_support_email: ''
  });

  // --- QUERIES ---
  const { data: configData } = useQuery({
    queryKey: ['platform-config'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/config');
      const data = resp.data.data.settings;
      setPlatformForm(data);
      return data;
    },
    enabled: isAdmin && activeTab === 'platform'
  });

  // --- MUTATIONS ---
  const profileMutation = useMutation({
    mutationFn: (data) => apiClient.patch('/auth/profile', data),
    onSuccess: () => alert('Profile updated successfully!')
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => apiClient.patch('/auth/password', { password: data.newPassword }),
    onSuccess: () => {
      alert('Password updated successfully!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    }
  });

  const configMutation = useMutation({
    mutationFn: (data) => apiClient.patch('/admin/config', data),
    onSuccess: () => alert('Platform settings updated!')
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    profileMutation.mutate({ full_name: profileForm.full_name, phone: profileForm.phone });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return alert('Passwords do not match');
    }
    passwordMutation.mutate(passwordForm);
  };

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    configMutation.mutate(platformForm);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Settings</h1>
          <p>Account management and platform configuration</p>
        </div>
      </div>

      <div className="tab-container">
        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={14} />} label="Profile" />
        <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Lock size={14} />} label="Security" />
        {isAdmin && <TabButton active={activeTab === 'platform'} onClick={() => setActiveTab('platform')} icon={<Globe size={14} />} label="Settings" />}
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '28px', maxWidth: '640px' }}>
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit}>
            <h3 style={{ fontSize: '15px', marginBottom: '18px', color: 'var(--text-main)' }}>Personal Information</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={profileForm.full_name} 
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} 
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                value={profileForm.phone} 
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} 
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={profileForm.email} readOnly className="form-control" />
            </div>
            <button type="submit" className="btn-compact" disabled={profileMutation.isPending} style={{ background: 'var(--primary)', color: 'white', border: 'none', marginTop: '8px' }}>
              <Save size={14} /> {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit}>
            <h3 style={{ fontSize: '15px', marginBottom: '18px', color: 'var(--text-main)' }}>Security & Password</h3>
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                value={passwordForm.newPassword} 
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                className="form-control"
                placeholder="Min 6 characters"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                value={passwordForm.confirmPassword} 
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                className="form-control"
              />
            </div>
            <button type="submit" className="btn-compact" disabled={passwordMutation.isPending} style={{ background: 'var(--primary)', color: 'white', border: 'none', marginTop: '8px' }}>
              <Save size={14} /> {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        {activeTab === 'platform' && (
          <form onSubmit={handleConfigSubmit}>
            <h3 style={{ fontSize: '15px', marginBottom: '18px', color: 'var(--text-main)' }}>Global Platform Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>GST Rate (%)</label>
                <input 
                  type="number" 
                  value={platformForm.gst_rate} 
                  onChange={(e) => setPlatformForm({ ...platformForm, gst_rate: e.target.value })} 
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Delivery Fee (₹)</label>
                <input 
                  type="number" 
                  value={platformForm.standard_delivery_fee} 
                  onChange={(e) => setPlatformForm({ ...platformForm, standard_delivery_fee: e.target.value })} 
                  className="form-control"
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Free Delivery Threshold (₹)</label>
                <input 
                  type="number" 
                  value={platformForm.free_delivery_threshold} 
                  onChange={(e) => setPlatformForm({ ...platformForm, free_delivery_threshold: e.target.value })} 
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Min Order Value (₹)</label>
                <input 
                  type="number" 
                  value={platformForm.min_order_value} 
                  onChange={(e) => setPlatformForm({ ...platformForm, min_order_value: e.target.value })} 
                  className="form-control"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Support Phone</label>
                <input 
                  type="text" 
                  value={platformForm.contact_support_phone} 
                  onChange={(e) => setPlatformForm({ ...platformForm, contact_support_phone: e.target.value })} 
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Support Email</label>
                <input 
                  type="email" 
                  value={platformForm.contact_support_email} 
                  onChange={(e) => setPlatformForm({ ...platformForm, contact_support_email: e.target.value })} 
                  className="form-control"
                />
              </div>
            </div>
            <button type="submit" className="btn-compact" disabled={configMutation.isPending} style={{ background: 'var(--primary)', color: 'white', border: 'none', marginTop: '8px' }}>
              <Save size={14} /> {configMutation.isPending ? 'Applying...' : 'Apply Global Settings'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`tab-item ${active ? 'active' : ''}`}
  >
    {icon} {label}
  </button>
);

export default SettingsPage;
