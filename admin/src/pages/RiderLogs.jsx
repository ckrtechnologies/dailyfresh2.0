import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Route, Gauge, Calendar as CalendarIcon } from 'lucide-react';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';

const RiderLogs = ({ storeId: propStoreId, dateRange: propDateRange, searchQuery: propSearchQuery } = {}) => {
  const filterContext = useFilters();
  const outletFilters = useOutletContext() || {};

  const globalStoreId = propStoreId ?? outletFilters.globalStoreId ?? filterContext.globalStoreId;
  const dateRange = propDateRange ?? outletFilters.dateRange ?? filterContext.dateRange;
  const searchQuery = propSearchQuery ?? outletFilters.searchQuery ?? filterContext.searchQuery;
  const setSearchQuery = outletFilters.setSearchQuery ?? filterContext.setSearchQuery;

  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });

  // Fetch Rider Logs
  const { data: response, isLoading } = useQuery({
    queryKey: ['rider-logs', pagination, searchQuery, dateRange, globalStoreId],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/rider-logs', {
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

  const columns = [
    { 
      header: 'Date', 
      accessor: (row) => row.log_date,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={14} color="var(--text-muted)" />
          <span>{new Date(row.log_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      )
    },
    { 
      header: 'Rider Name', 
      accessor: (row) => row.rider?.user?.full_name || 'N/A'
    },
    { 
      header: 'Phone', 
      accessor: (row) => row.rider?.user?.phone || 'N/A'
    },
    { 
      header: 'Start Reading', 
      accessor: (row) => row.start_reading,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Gauge size={14} color="var(--success)" />
          <span>{row.start_reading} KM</span>
        </div>
      )
    },
    { 
      header: 'End Reading', 
      accessor: (row) => row.end_reading,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Gauge size={14} color="var(--danger)" />
          <span>{row.end_reading} KM</span>
        </div>
      )
    },
    { 
      header: 'Total Distance', 
      accessor: (row) => row.distance_km,
      render: (row) => (
        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
          {row.distance_km} KM
        </span>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Rider Logs</h1>
          <p>View daily distance reports and odometer readings</p>
        </div>
      </div>

      <DataTable 
        title="Distance Logs"
        columns={columns}
        data={response?.logs || []}
        loading={isLoading}
        pagination={response?.pagination || pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) => setPagination({ page: 1, pageSize })}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
};

export default RiderLogs;
