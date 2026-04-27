import React from 'react';
import { ShoppingCart, Users, DollarSign, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useFilters } from '../context/FilterContext';
import apiClient from '../services/api';

const StatsCard = ({ title, value, icon: Icon, color, trend, trendValue, loading }) => (
  <div className="glass-panel stat-card">
    <div className="stat-icon" style={{ background: `${color}15`, color: color }}>
      <Icon size={16} />
    </div>
    <div style={{ flex: 1 }}>
      <h3 style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{title}</h3>
      {loading ? (
        <div style={{ height: '20px', width: '60px', background: '#f1f5f9', borderRadius: '4px', marginTop: '4px', animation: 'pulse 1.5s infinite' }} />
      ) : (
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>{value}</p>
      )}
    </div>
    {!loading && trend && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: trend === 'up' ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
        <TrendingUp size={11} style={{ transform: trend === 'down' ? 'rotate(180deg)' : 'none' }} />
        <span>{trendValue}%</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { globalStoreId, dateRange, searchQuery } = useFilters();

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-stats', globalStoreId, dateRange],
    queryFn: async () => {
      const storeIdToFetch = isAdmin ? globalStoreId : user.store_id;
      const response = await apiClient.get('/admin/stats', {
        params: { 
          store_id: storeIdToFetch || undefined,
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined
        }
      });
      return response.data.data;
    }
  });

  const stats = dashboardData?.stats || {};
  const recentOrders = dashboardData?.live_orders || [];
  const lowStock = dashboardData?.low_stock || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Overview</h1>
          <p>Activity status for {user?.full_name}</p>
        </div>
        <div className="page-actions">
          <button className="btn-compact" style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>
            Export Report
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <StatsCard title="Revenue" value={`₹${(stats.revenue || 0).toLocaleString()}`} icon={DollarSign} color="#10b981" loading={dashboardLoading} />
        <StatsCard title="AOV" value={`₹${stats.aov || 0}`} icon={TrendingUp} color="#3b82f6" loading={dashboardLoading} />
        <StatsCard title="Total Orders" value={stats.orders || 0} icon={ShoppingCart} color="#6366f1" loading={dashboardLoading} />
        <StatsCard title="Cancelled" value={stats.cancelled_orders || 0} icon={AlertTriangle} color="#ef4444" loading={dashboardLoading} />
        {isAdmin && (
          <>
            <StatsCard title="Active Riders" value={`${stats.active_riders || 0} / ${stats.total_riders || 0}`} icon={Package} color="#f59e0b" loading={dashboardLoading} />
            <StatsCard title="Customers" value={stats.customers || 0} icon={Users} color="#8b5cf6" loading={dashboardLoading} />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Live Orders</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>S.No</th>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Store</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan="6" style={{ padding: '10px' }}><div style={{ height: '14px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} /></td></tr>
                  ))
                ) : recentOrders.map((order, i) => (
                  <tr key={order.id}>
                    <td>{i + 1}</td>
                    <td><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.order_number}</span></td>
                    <td>{order.customer?.full_name}</td>
                    <td><span className="badge badge-pending" style={{ background: '#f1f5f9', color: 'var(--text-main)' }}>{order.store?.name}</span></td>
                    <td>₹{Number(order.total_amount).toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge badge-${order.status === 'delivered' ? 'active' : order.status === 'cancelled' ? 'failed' : 'pending'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && !dashboardLoading && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No live orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Inventory Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lowStock.length > 0 ? lowStock.map((prod, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', padding: '10px', background: '#fef2f2', borderRadius: '4px', borderLeft: '3px solid var(--danger)' }}>
                <AlertTriangle size={14} color="var(--danger)" />
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#991b1b' }}>{prod.name}</p>
                  <p style={{ fontSize: '11px', color: '#b91c1c' }}>{prod.stock_quantity} {prod.weight_unit} left at {prod.store?.name}</p>
                </div>
              </div>
            )) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>No inventory alerts</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Top Stores</h3>
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <TrendingUp size={24} style={{ marginBottom: '8px', opacity: 0.2 }} />
            <p>Store performance analytics coming soon</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Top Products</h3>
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <Package size={24} style={{ marginBottom: '8px', opacity: 0.2 }} />
            <p>Product sales insights coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
