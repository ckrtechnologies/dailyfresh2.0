import React, { useState, useEffect } from 'react';
import { User, Bell, Search, Calendar, Store, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api';

const Header = () => {
  const { user, isAdmin } = useAuth();
  const { globalStoreId, setGlobalStoreId, dateRange, setDateRange, searchQuery, setSearchQuery } = useFilters();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localDates, setLocalDates] = useState(dateRange);
  const [preset, setPreset] = useState('all');

  // Sync localSearch if searchQuery changes from outside
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, setSearchQuery]);

  // Sync localDates if dateRange changes externally
  useEffect(() => {
    setLocalDates(dateRange);
    if (!dateRange.startDate && !dateRange.endDate) {
      setPreset('all');
    }
  }, [dateRange]);

  // Debounced dateRange update to prevent rapid aborted requests
  useEffect(() => {
    const timer = setTimeout(() => {
      let s = localDates.startDate;
      let e = localDates.endDate;
      if (s && e && s > e) {
        const temp = s;
        s = e;
        e = temp;
        setLocalDates({ startDate: s, endDate: e });
      }
      if (
        s !== dateRange.startDate || 
        e !== dateRange.endDate
      ) {
        setDateRange({ startDate: s, endDate: e });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localDates, dateRange, setDateRange]);

  const handlePresetChange = (val) => {
    setPreset(val);
    const today = new Date();
    const formatDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (val === 'all') {
      const empty = { startDate: '', endDate: '' };
      setLocalDates(empty);
      setDateRange(empty);
    } else if (val === 'today') {
      const d = formatDate(today);
      const range = { startDate: d, endDate: d };
      setLocalDates(range);
      setDateRange(range);
    } else if (val === 'yesterday') {
      const past = new Date();
      past.setDate(today.getDate() - 1);
      const d = formatDate(past);
      const range = { startDate: d, endDate: d };
      setLocalDates(range);
      setDateRange(range);
    } else if (val === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      const range = { startDate: formatDate(past), endDate: formatDate(today) };
      setLocalDates(range);
      setDateRange(range);
    } else if (val === '30days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      const range = { startDate: formatDate(past), endDate: formatDate(today) };
      setLocalDates(range);
      setDateRange(range);
    }
  };

  const handleClearDates = () => {
    setPreset('all');
    const empty = { startDate: '', endDate: '' };
    setLocalDates(empty);
    setDateRange(empty);
  };

  // Fetch stores for the global selector
  const { data: storeResp } = useQuery({
    queryKey: ['admin-stores-list'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/stores');
      return resp.data.data.stores;
    },
    enabled: !!isAdmin
  });

  const hasActiveDates = !!(localDates.startDate || localDates.endDate);

  return (
    <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
      <div className="header-search" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search orders, products, users..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ padding: '6px 28px 6px 32px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px', width: '220px', outline: 'none' }}
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                setSearchQuery('');
              }}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)'
              }}
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
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

        {/* Date Range Filter with Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <Calendar size={14} style={{ color: 'var(--primary)' }} />
          
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '11px', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          <span style={{ color: '#cbd5e1' }}>|</span>

          <input 
            type="date" 
            value={localDates.startDate} 
            onChange={(e) => {
              const val = e.target.value;
              setPreset('custom');
              setLocalDates(prev => {
                const nextEnd = (prev.endDate && val && val > prev.endDate) ? val : prev.endDate;
                return { startDate: val, endDate: nextEnd };
              });
            }}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '11px', color: 'var(--text-main)' }} 
          />
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <input 
            type="date" 
            value={localDates.endDate} 
            onChange={(e) => {
              const val = e.target.value;
              setPreset('custom');
              setLocalDates(prev => {
                const nextStart = (prev.startDate && val && val < prev.startDate) ? val : prev.startDate;
                return { startDate: nextStart, endDate: val };
              });
            }}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '11px', color: 'var(--text-main)' }} 
          />

          {hasActiveDates && (
            <button
              onClick={handleClearDates}
              title="Reset to All Time"
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                marginLeft: '4px'
              }}
            >
              <X size={11} />
            </button>
          )}
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
