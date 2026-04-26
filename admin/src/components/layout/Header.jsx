import React, { useState, useEffect } from 'react';
import { User, Bell, Search, Calendar, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api';

const Header = () => {
  const { user, isAdmin } = useAuth();
  const { globalStoreId, setGlobalStoreId, dateRange, setDateRange, setSearchQuery } = useFilters();
  const [localSearch, setLocalSearch] = useState('');

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  // Fetch stores for the global selector
  const { data: storeResp } = useQuery({
    queryKey: ['admin-stores-list'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/stores');
      return resp.data.data.stores;
    },
    enabled: isAdmin // Only admins can filter globally
  });

  return (
    <header className="header" style={{ height: 'auto', minHeight: '60px', padding: '8px 20px', flexWrap: 'wrap', gap: '12px' }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
        <div className="search-container" style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Global search..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '6px 10px 6px 32px', color: 'var(--text-main)', width: '200px', fontSize: '12px' }} 
          />
        </div>

        {/* Store Filter */}
        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <Store size={14} style={{ color: 'var(--primary)' }} />
            <select 
              value={globalStoreId} 
              onChange={(e) => setGlobalStoreId(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: '12px', fontWeight: '500', minWidth: '120px' }}
            >
              <option value="">All Stores</option>
              {storeResp?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Date Range Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <Calendar size={14} style={{ color: 'var(--primary)' }} />
          <input 
            type="date" 
            value={dateRange.startDate} 
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '11px' }} 
          />
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <input 
            type="date" 
            value={dateRange.endDate} 
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '11px' }} 
          />
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><Bell size={18} /></button>
        
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '16px', borderLeft: '1px solid var(--border)' }}>
          <div className="user-info" style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{user?.full_name}</p>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{user?.role}</p>
          </div>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <User size={16} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
