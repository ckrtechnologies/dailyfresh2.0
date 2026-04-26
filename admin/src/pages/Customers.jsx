import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';
import { StaffForm } from '../components/modals/EntityForms';

const Customers = () => {
  const { searchQuery } = useFilters();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ['customers', pagination, searchQuery],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/customers', {
        params: { ...pagination, search: searchQuery || undefined }
      });
      return resp.data.data;
    }
  });

  // Create Customer Mutation
  const mutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/onboard-staff', { ...data, role: 'customer' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setIsModalOpen(false);
      alert('Customer created successfully!');
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to create customer')
  });

  const columns = [
    {
      header: 'Full Name',
      accessor: (row) => row.full_name,
      render: (row) => <span style={{ fontWeight: '500' }}>{row.full_name}</span>
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
      accessor: (row) => row.is_active,
      align: 'center',
      render: (row) => (
        <span className={`badge badge-${row.is_active ? 'active' : 'failed'}`}>
          {row.is_active ? 'Active' : 'Disabled'}
        </span>
      )
    },
    {
      header: 'Joined On',
      accessor: (row) => new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      align: 'center'
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Customers</h1>
          <p>View and manage registered customers</p>
        </div>
        <div className="page-actions">
          <button
            className="btn-compact"
            onClick={() => setIsModalOpen(true)}
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
        pagination={response?.pagination || pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) => setPagination({ page: 1, pageSize })}
      />

      {isModalOpen && (
        <StaffForm
          type="customer"
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => mutation.mutate(data)}
          loading={mutation.isPending}
        />
      )}
    </div>
  );
};

export default Customers;
