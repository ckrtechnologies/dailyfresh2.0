import React, { useState } from 'react';
import { 
  User, Lock, Globe, Save, Smartphone, ShieldAlert, CheckCircle2, 
  AlertTriangle, ExternalLink, RefreshCw, Layers, BellRing 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';

const SettingsPage = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [activeAppTab, setActiveAppTab] = useState('customer_android');
  
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
    gst_rate: '',
    free_delivery_threshold: '',
    standard_delivery_fee: '',
    min_order_value: '',
    contact_support_phone: '',
    contact_support_email: '',
    delivery_slots_config: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    is_active: false,
    message: 'DailyFresh is currently undergoing routine maintenance. We will be back shortly!'
  });

  const [versionPolicies, setVersionPolicies] = useState({
    customer_android: {
      min_supported_version: '1.0.0',
      latest_version: '1.2.0',
      force_update: false,
      update_url: 'https://play.google.com/store/apps/details?id=com.dailyfresh.customer',
      title: 'New Update Available',
      message: 'A new version of DailyFresh is available with fresh features and bug fixes.'
    },
    customer_ios: {
      min_supported_version: '1.0.0',
      latest_version: '1.2.0',
      force_update: false,
      update_url: 'https://apps.apple.com/app/dailyfresh/id123456789',
      title: 'New Update Available',
      message: 'A new version of DailyFresh is available on the App Store.'
    },
    rider_android: {
      min_supported_version: '1.0.0',
      latest_version: '1.1.0',
      force_update: false,
      update_url: 'https://play.google.com/store/apps/details?id=com.dailyfresh.rider',
      title: 'Rider App Update',
      message: 'A mandatory update is required for live delivery navigation and order dispatch.'
    },
    store_android: {
      min_supported_version: '1.0.0',
      latest_version: '1.1.0',
      force_update: false,
      update_url: 'https://play.google.com/store/apps/details?id=com.dailyfresh.store',
      title: 'Store Manager Update',
      message: 'A new update is available for order processing and inventory controls.'
    }
  });

  // --- QUERIES ---
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['platform-config'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/config');
      const data = resp.data?.data?.settings || resp.data?.data?.config || {};
      
      setPlatformForm({
        gst_rate: data.gst_rate ?? '',
        free_delivery_threshold: data.free_delivery_threshold ?? '',
        standard_delivery_fee: data.default_delivery_charge ?? data.standard_delivery_fee ?? '',
        min_order_value: data.min_order_value ?? '',
        contact_support_phone: data.support_phone ?? data.contact_support_phone ?? '',
        contact_support_email: data.support_email ?? data.contact_support_email ?? '',
        delivery_slots_config: typeof data.delivery_slots_config === 'object' 
          ? JSON.stringify(data.delivery_slots_config, null, 2) 
          : data.delivery_slots_config ?? ''
      });

      if (data.maintenance_mode) {
        setMaintenanceForm({
          is_active: Boolean(data.maintenance_mode.is_active),
          message: data.maintenance_mode.message || 'DailyFresh is currently undergoing routine maintenance. We will be back shortly!'
        });
      }

      setVersionPolicies(prev => ({
        customer_android: data.app_version_customer_android 
          ? { ...prev.customer_android, ...data.app_version_customer_android } 
          : prev.customer_android,
        customer_ios: data.app_version_customer_ios 
          ? { ...prev.customer_ios, ...data.app_version_customer_ios } 
          : prev.customer_ios,
        rider_android: data.app_version_rider_android 
          ? { ...prev.rider_android, ...data.app_version_rider_android } 
          : prev.rider_android,
        store_android: data.app_version_store_android 
          ? { ...prev.store_android, ...data.app_version_store_android } 
          : prev.store_android
      }));

      return data;
    },
    enabled: isAdmin && (activeTab === 'platform' || activeTab === 'app_releases')
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
    onSuccess: () => {
      queryClient.invalidateQueries(['platform-config']);
      alert('Settings saved successfully!');
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to update settings')
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

  const handleAppPoliciesSubmit = (e) => {
    e.preventDefault();
    configMutation.mutate({
      maintenance_mode: maintenanceForm,
      app_version_customer_android: versionPolicies.customer_android,
      app_version_customer_ios: versionPolicies.customer_ios,
      app_version_rider_android: versionPolicies.rider_android,
      app_version_store_android: versionPolicies.store_android
    });
  };

  const updateCurrentPolicy = (field, value) => {
    setVersionPolicies(prev => ({
      ...prev,
      [activeAppTab]: {
        ...prev[activeAppTab],
        [field]: value
      }
    }));
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Settings</h1>
          <p>Account credentials, global platform controls, and app release policies</p>
        </div>
      </div>

      <div className="tab-container">
        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={14} />} label="Profile" />
        <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Lock size={14} />} label="Security" />
        {isAdmin && <TabButton active={activeTab === 'platform'} onClick={() => setActiveTab('platform')} icon={<Globe size={14} />} label="Platform Settings" />}
        {isAdmin && <TabButton active={activeTab === 'app_releases'} onClick={() => setActiveTab('app_releases')} icon={<Smartphone size={14} />} label="App Releases & Policies" />}
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '24px', maxWidth: activeTab === 'app_releases' ? '880px' : '640px' }}>
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
              <input type="email" value={profileForm.email} readOnly className="form-control" style={{ background: '#f8fafc', cursor: 'not-allowed' }} />
            </div>
            <button type="submit" className="btn-compact" disabled={profileMutation.isPending} style={{ background: 'var(--primary)', color: 'white', border: 'none', marginTop: '8px' }}>
              <Save size={14} /> {profileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
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
                <label>Standard Delivery Fee (₹)</label>
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

        {activeTab === 'app_releases' && (
          <form onSubmit={handleAppPoliciesSubmit}>
            {/* Maintenance Mode Banner & Controls */}
            <div style={{
              background: maintenanceForm.is_active ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${maintenanceForm.is_active ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={20} color={maintenanceForm.is_active ? '#dc2626' : '#16a34a'} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', color: maintenanceForm.is_active ? '#991b1b' : '#166534', fontWeight: '700' }}>
                      Emergency Maintenance Mode
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: maintenanceForm.is_active ? '#b91c1c' : '#15803d' }}>
                      {maintenanceForm.is_active 
                        ? 'CRITICAL: Customer and Partner apps are locked behind the maintenance screen' 
                        : 'System is healthy and accepting online transactions'}
                    </p>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', color: maintenanceForm.is_active ? '#dc2626' : '#16a34a' }}>
                  <input 
                    type="checkbox"
                    checked={maintenanceForm.is_active}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    style={{ width: '16px', height: '16px', accentColor: '#dc2626' }}
                  />
                  <span>{maintenanceForm.is_active ? 'ACTIVE (BLOCKING)' : 'INACTIVE'}</span>
                </label>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Public Announcement Message</label>
                <input 
                  type="text"
                  value={maintenanceForm.message}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, message: e.target.value }))}
                  className="form-control"
                  placeholder="Reason or estimated return time..."
                />
              </div>
            </div>

            {/* App Selection Subtabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              {[
                { id: 'customer_android', label: 'Customer Android' },
                { id: 'customer_ios', label: 'Customer iOS' },
                { id: 'rider_android', label: 'Rider Android' },
                { id: 'store_android', label: 'Store Manager' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveAppTab(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: activeAppTab === tab.id ? '700' : '500',
                    border: '1px solid',
                    borderColor: activeAppTab === tab.id ? 'var(--primary)' : 'var(--border)',
                    background: activeAppTab === tab.id ? 'var(--primary-light)' : 'white',
                    color: activeAppTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Policy Config Panel */}
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border)', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Minimum Supported Version</label>
                  <input 
                    type="text" 
                    value={versionPolicies[activeAppTab]?.min_supported_version || ''} 
                    onChange={(e) => updateCurrentPolicy('min_supported_version', e.target.value)} 
                    className="form-control"
                    placeholder="e.g. 1.0.0"
                  />
                  <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Versions below this are hard-locked until upgraded.</small>
                </div>

                <div className="form-group">
                  <label>Latest Released Version</label>
                  <input 
                    type="text" 
                    value={versionPolicies[activeAppTab]?.latest_version || ''} 
                    onChange={(e) => updateCurrentPolicy('latest_version', e.target.value)} 
                    className="form-control"
                    placeholder="e.g. 1.2.0"
                  />
                  <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latest build in Google Play / App Store.</small>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Store / Download URL</label>
                <input 
                  type="text" 
                  value={versionPolicies[activeAppTab]?.update_url || ''} 
                  onChange={(e) => updateCurrentPolicy('update_url', e.target.value)} 
                  className="form-control"
                  placeholder="https://play.google.com/store/apps/details?id=..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Update Modal Title</label>
                  <input 
                    type="text" 
                    value={versionPolicies[activeAppTab]?.title || ''} 
                    onChange={(e) => updateCurrentPolicy('title', e.target.value)} 
                    className="form-control"
                    placeholder="Update Available"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '22px' }}>
                    <input 
                      type="checkbox"
                      checked={Boolean(versionPolicies[activeAppTab]?.force_update)}
                      onChange={(e) => updateCurrentPolicy('force_update', e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                      Enforce Mandatory Update
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Update Release Notes / Description</label>
                <textarea 
                  rows={3}
                  value={versionPolicies[activeAppTab]?.message || ''} 
                  onChange={(e) => updateCurrentPolicy('message', e.target.value)} 
                  className="form-control"
                  placeholder="Describe improvements and why users should update..."
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-compact" 
              disabled={configMutation.isPending} 
              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', fontWeight: '600' }}
            >
              <Save size={14} /> {configMutation.isPending ? 'Deploying...' : 'Deploy App Release Policies'}
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
