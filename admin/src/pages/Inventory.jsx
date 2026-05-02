import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, Layers, Package, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import DataTable from '../components/common/DataTable';
import { useFilters } from '../context/FilterContext';
import { CategoryForm, ProductForm, SubCategoryForm } from '../components/modals/EntityForms';

const Inventory = () => {
  const { user, isAdmin, isStoreManager } = useAuth();
  const { globalStoreId, searchQuery } = useFilters();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('products');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
  const [modal, setModal] = useState({ show: false, type: null, data: null });

  // --- DATA FETCHING ---
  const { data: prodResp, isLoading: prodLoading } = useQuery({
    queryKey: ['admin-products', pagination, user?.store_id, globalStoreId, searchQuery],
    queryFn: async () => {
      const storeIdToFetch = isStoreManager ? user.store_id : globalStoreId;
      const resp = await apiClient.get('/admin/products', { 
        params: { ...pagination, store_id: storeIdToFetch || undefined, search: searchQuery || undefined } 
      });
      return resp.data.data;
    },
    enabled: activeTab === 'products'
  });

  const { data: subCatResp } = useQuery({
    queryKey: ['admin-subcategories'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/sub-categories');
      return resp.data.data.sub_categories;
    },
    enabled: isAdmin || (activeTab === 'products' && modal.show)
  });

  const { data: catResp } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/categories');
      return resp.data.data.categories;
    },
    enabled: isAdmin || (activeTab === 'products' && modal.show)
  });

  const { data: storeResp } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/stores');
      return resp.data.data.stores;
    },
    enabled: isAdmin
  });

  // --- MUTATIONS ---
  const mutation = useMutation({
    mutationFn: async ({ type, method, id, data }) => {
      const url = `/admin/${type === 'subcategories' ? 'sub-categories' : type}${id ? `/${id}` : ''}`;
      
      let payload = data;
      // Always use FormData for catalog entities to satisfy Multer on the backend
      const imageTypes = ['products', 'categories', 'subcategories'];
      if (imageTypes.includes(type) && method !== 'DELETE' && !(data instanceof FormData)) {
        payload = new FormData();
        Object.keys(data).forEach(key => {
          if (key === 'imageFile') {
            if (data[key]) payload.append('image', data[key]);
          } else if (key === 'variants' && Array.isArray(data[key])) {
            // Special handling for variants to extract files and append to FormData
            const variantsWithoutFiles = data[key].map((v, index) => {
              if (v.imageFile) {
                payload.append(`variant_image_${index}`, v.imageFile);
              }
              const { imageFile, ...rest } = v;
              return rest;
            });
            payload.append(key, JSON.stringify(variantsWithoutFiles));
          } else if (data[key] !== undefined && data[key] !== null) {
            // Stringify objects/arrays so they don't become "[object Object]"
            const value = (typeof data[key] === 'object' && !(data[key] instanceof File)) 
              ? JSON.stringify(data[key]) 
              : data[key];
            payload.append(key, value);
          }
        });
      }

      const config = {};
      return method === 'DELETE' 
        ? apiClient.delete(url) 
        : (id ? apiClient.patch(url, payload, config) : apiClient.post(url, payload, config));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['admin-categories']);
      queryClient.invalidateQueries(['admin-subcategories']);
      setModal({ show: false, type: null, data: null });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      alert(error.response?.data?.message || error.message || 'Operation failed');
    }
  });

  const handleDelete = (type, id) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      mutation.mutate({ type, method: 'DELETE', id });
    }
  };

  const commonProps = {
    onClose: () => setModal({ show: false, type: null, data: null }),
    loading: mutation.isPending
  };

  const columns = {
    products: [
      { header: 'Image', accessor: 'image_url', render: (row) => (
        <div 
          onClick={() => setModal({ show: true, type: 'products', data: row })}
          style={{ width: '44px', height: '44px', borderRadius: '6px', background: '#f1f5f9', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative' }}
          className="image-cell-container"
        >
          {row.image_url ? (
            <img src={row.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <ImageIcon size={14} style={{ margin: '15px', color: '#94a3b8' }} />
          )}
          <div className="image-overlay">
            <Pencil size={10} color="white" />
          </div>
        </div>
      )},
      { header: 'Product', accessor: 'name', render: (row) => <div><div style={{ fontWeight: '600' }}>{row.name}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SKU: {row.sku || 'N/A'}</div></div> },
      { header: 'Hierarchy', accessor: (row) => row.sub_category?.name, render: (row) => <div style={{ fontSize: '11px' }}><span style={{ color: 'var(--primary)', fontWeight: '500' }}>{row.sub_category?.category?.name}</span><span style={{ margin: '0 4px', color: '#cbd5e1' }}>›</span><span>{row.sub_category?.name}</span></div> },
      isAdmin && { header: 'Store', accessor: (row) => row.store?.name, render: (row) => <div style={{ fontSize: '11px', fontWeight: '500' }}><span className="badge badge-pending">{row.store?.name || 'Global'}</span></div> },
      { header: 'Price', accessor: 'price', align: 'right', render: (row) => <b>₹{row.price}</b> },
      { header: 'Express Stock', accessor: 'express_stock_qty', align: 'right', render: (row) => <span style={{ fontWeight: '600', color: row.express_stock_qty < 10 ? 'var(--danger)' : 'inherit' }}>{row.express_stock_qty} {row.weight_unit}</span> },
      { header: 'Sched. Stock', accessor: 'scheduled_stock_qty', align: 'right', render: (row) => <span style={{ fontWeight: '600', color: row.scheduled_stock_qty < 10 ? 'var(--danger)' : 'inherit' }}>{row.scheduled_stock_qty} {row.weight_unit}</span> },
      { header: 'Actions', accessor: 'id', align: 'center', render: (row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={() => setModal({ show: true, type: 'products', data: row })} className="btn-icon"><Pencil size={12} /></button>
          {isAdmin && <button onClick={() => handleDelete('products', row.id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>}
        </div>
      )}
    ],
    categories: [
      { header: 'Image', accessor: 'image_url', render: (row) => (
        <div 
          onClick={() => setModal({ show: true, type: 'categories', data: row })}
          style={{ width: '44px', height: '44px', borderRadius: '6px', background: '#f1f5f9', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative' }}
          className="image-cell-container"
        >
          {row.image_url ? (
            <img src={row.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <ImageIcon size={14} style={{ margin: '15px', color: '#94a3b8' }} />
          )}
          <div className="image-overlay">
            <Pencil size={10} color="white" />
          </div>
        </div>
      )},
      { header: 'Category Name', accessor: 'name', render: (row) => <span style={{ fontWeight: '600' }}>{row.name}</span> },
      { header: 'Slug', accessor: 'slug' },
      { header: 'Actions', accessor: 'id', align: 'center', render: (row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {isAdmin && <button onClick={() => setModal({ show: true, type: 'categories', data: row })} className="btn-icon"><Pencil size={12} /></button>}
          {isAdmin && <button onClick={() => handleDelete('categories', row.id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>}
        </div>
      )}
    ],
    subcategories: [
      { header: 'Image', accessor: 'image_url', render: (row) => (
        <div 
          onClick={() => setModal({ show: true, type: 'subcategories', data: row })}
          style={{ width: '44px', height: '44px', borderRadius: '6px', background: '#f1f5f9', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative' }}
          className="image-cell-container"
        >
          {row.image_url ? (
            <img src={row.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <ImageIcon size={14} style={{ margin: '15px', color: '#94a3b8' }} />
          )}
          <div className="image-overlay">
            <Pencil size={10} color="white" />
          </div>
        </div>
      )},
      { header: 'Sub-Category', accessor: 'name', render: (row) => <span style={{ fontWeight: '600' }}>{row.name}</span> },
      { header: 'Parent Category', accessor: (row) => row.category?.name, render: (row) => <span className="badge badge-pending">{row.category?.name}</span> },
      { header: 'Actions', accessor: 'id', align: 'center', render: (row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {isAdmin && <button onClick={() => setModal({ show: true, type: 'subcategories', data: row })} className="btn-icon"><Pencil size={12} /></button>}
          {isAdmin && <button onClick={() => handleDelete('subcategories', row.id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>}
        </div>
      )}
    ]
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Product Catalog</h1>
          <p>{isAdmin ? 'Global catalog and stock management' : 'Manage your store inventory'}</p>
        </div>
        {(isAdmin || activeTab === 'products') && (
          <div className="page-actions">
            <button onClick={() => setModal({ show: true, type: activeTab, data: null })} className="btn-compact" style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={14} /> Add {activeTab === 'products' ? 'Product' : activeTab === 'categories' ? 'Category' : 'Sub-Category'}
            </button>
          </div>
        )}
      </div>

      <div className="tab-container">
        <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package size={14} />} label="Products" />
        {isAdmin && (
          <>
            <TabButton active={activeTab === 'subcategories'} onClick={() => setActiveTab('subcategories')} icon={<Tag size={14} />} label="Sub-Categories" />
            <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={<Layers size={14} />} label="Categories" />
          </>
        )}
      </div>

      <DataTable 
        title={activeTab} 
        columns={columns[activeTab] || []} 
        data={activeTab === 'products' ? prodResp?.products || [] : activeTab === 'subcategories' ? subCatResp || [] : catResp || []} 
        loading={prodLoading} 
        pagination={activeTab === 'products' ? (prodResp?.pagination || pagination) : { total: 0, page: 1, pageSize: 50 }}
        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
      />

      {modal.show && modal.type === 'products' && (
        <ProductForm 
          {...commonProps} 
          initialData={modal.data} 
          isManager={isStoreManager}
          stores={storeResp?.map(s => ({ id: s.id, name: s.name })) || []}
          subcategories={subCatResp?.map(s => ({ id: s.id, name: s.name })) || []}
          onSave={(data) => mutation.mutate({ type: 'products', id: modal.data?.id, method: modal.data ? 'PATCH' : 'POST', data })} 
        />
      )}

      {modal.show && modal.type === 'categories' && (
        <CategoryForm 
          {...commonProps} 
          initialData={modal.data} 
          onSave={(data) => mutation.mutate({ type: 'categories', id: modal.data?.id, method: modal.data ? 'PATCH' : 'POST', data })} 
        />
      )}
      {modal.show && modal.type === 'subcategories' && (
        <SubCategoryForm 
          {...commonProps} 
          initialData={modal.data} 
          categories={catResp?.map(c => ({ id: c.id, name: c.name })) || []}
          onSave={(data) => mutation.mutate({ type: 'subcategories', id: modal.data?.id, method: modal.data ? 'PATCH' : 'POST', data })} 
        />
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`tab-item ${active ? 'active' : ''}`}>
    {icon} {label}
  </button>
);

export default Inventory;
