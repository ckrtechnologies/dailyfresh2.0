import React from 'react';
import { Download } from 'lucide-react';
import { 
  HiCurrencyRupee, 
  HiArrowTrendingUp, 
  HiShoppingBag, 
  HiXCircle, 
  HiTruck, 
  HiUserGroup, 
  HiExclamationTriangle,
  HiArrowUpRight
} from 'react-icons/hi2';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList,
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useFilters } from '../context/FilterContext';
import apiClient from '../services/api';
import { exportToCsv } from '../utils/exportCsv';

const STATUS_COLORS = {
  placed: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready_for_pickup: '#06b6d4',
  out_for_delivery: '#6366f1',
  delivered: '#10b981',
  cancelled: '#ef4444'
};

const StatsCard = ({ title, value, icon: Icon, color, trend, trendValue, loading, onClick }) => (
  <div 
    onClick={onClick}
    className="glass-panel stat-card" 
    style={{ 
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      userSelect: 'none'
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(0,0,0,0.08)';
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }
    }}
  >
    <div 
      className="stat-icon" 
      style={{ 
        background: color, 
        color: '#ffffff',
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 4px 10px -2px ${color}66`
      }}
    >
      <Icon size={18} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{title}</h3>
        {onClick && <HiArrowUpRight size={13} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />}
      </div>
      {loading ? (
        <div style={{ height: '20px', width: '60px', background: '#f1f5f9', borderRadius: '4px', marginTop: '4px', animation: 'pulse 1.5s infinite' }} />
      ) : (
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)', margin: '4px 0 0 0' }}>{value}</p>
      )}
    </div>
    {!loading && trend && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: trend === 'up' ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
        <HiArrowTrendingUp size={12} style={{ transform: trend === 'down' ? 'rotate(180deg)' : 'none' }} />
        <span>{trendValue}%</span>
      </div>
    )}
  </div>
);

const Dashboard = ({ storeId: propStoreId, dateRange: propDateRange } = {}) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const filterContext = useFilters();
  const outletFilters = useOutletContext() || {};

  const globalStoreId = propStoreId ?? outletFilters.globalStoreId ?? filterContext.globalStoreId;
  const setGlobalStoreId = outletFilters.setGlobalStoreId ?? filterContext.setGlobalStoreId;
  const dateRange = propDateRange ?? outletFilters.dateRange ?? filterContext.dateRange;
  const setSearchQuery = outletFilters.setSearchQuery ?? filterContext.setSearchQuery;
  const setDateRange = outletFilters.setDateRange ?? filterContext.setDateRange;

  const storeIdToFetch = isAdmin ? globalStoreId : user?.store_id;

  // 1. Basic Stats & Live Orders (Respects dateRange & storeId)
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-stats', storeIdToFetch, dateRange],
    queryFn: async () => {
      const response = await apiClient.get('/admin/stats', {
        params: { 
          store_id: storeIdToFetch || undefined,
          startDate: dateRange?.startDate || undefined,
          endDate: dateRange?.endDate || undefined
        }
      });
      return response.data.data;
    }
  });

  // 2. Revenue Over Time Chart Data
  const { data: revenueChartData, isLoading: chartLoading } = useQuery({
    queryKey: ['revenue-chart', storeIdToFetch, dateRange],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/analytics/revenue-chart', {
        params: {
          store_id: storeIdToFetch || undefined,
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined
        }
      });
      return resp.data.data?.chart || [];
    }
  });

  // 3. Orders Status Breakdown
  const { data: statusBreakdownData } = useQuery({
    queryKey: ['orders-by-status', storeIdToFetch, dateRange],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/analytics/orders-by-status', {
        params: {
          store_id: storeIdToFetch || undefined,
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined
        }
      });
      return resp.data.data?.statuses || [];
    }
  });

  // 4. Top Products (Respects dateRange & storeId)
  const { data: topProductsData, isLoading: topProductsLoading } = useQuery({
    queryKey: ['top-products', storeIdToFetch, dateRange],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/analytics/top-products', {
        params: { 
          store_id: storeIdToFetch || undefined,
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined,
          limit: 6 
        }
      });
      return resp.data.data?.products || [];
    }
  });

  // 5. Store Performance (Respects dateRange)
  const { data: storePerfData, isLoading: storePerfLoading } = useQuery({
    queryKey: ['store-performance', dateRange],
    queryFn: async () => {
      const resp = await apiClient.get('/admin/analytics/store-performance', {
        params: {
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined
        }
      });
      return resp.data.data?.stores || [];
    }
  });

  const stats = dashboardData?.stats || {};
  const recentOrders = dashboardData?.live_orders || [];
  const lowStock = dashboardData?.low_stock || [];

  const pieData = (statusBreakdownData || []).map(s => ({
    name: s.status ? s.status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN',
    value: Number(s.count) || 0,
    color: STATUS_COLORS[s.status] || '#94a3b8'
  }));
  const totalStageOrders = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
    if (!value || percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  const handleExportReport = () => {
    if (!recentOrders || !recentOrders.length) {
      alert('No order data to export for this selection');
      return;
    }

    const exportRows = recentOrders.map((o, idx) => ({
      'S.No': idx + 1,
      'Order Number': o.order_number,
      'Customer': o.customer?.full_name || 'Guest',
      'Customer Phone': o.customer?.phone || 'N/A',
      'Store': o.store?.name || 'Central',
      'Amount (INR)': o.total_amount,
      'Status': o.status,
      'Created Date': new Date(o.created_at).toLocaleDateString('en-GB')
    }));

    exportToCsv(exportRows, `sales_report_${storeIdToFetch || 'all_stores'}`);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '32px' }}>
      <div className="page-header">
        <div className="page-title">
          <h1>Overview</h1>
          <p>Activity status for {user?.full_name} • Operational Insights</p>
        </div>
        <div className="page-actions">
          <button 
            onClick={handleExportReport}
            className="btn-compact" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            <Download size={13} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards with Click Navigation */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <StatsCard 
          title="Revenue" 
          value={`₹${(stats.revenue || 0).toLocaleString()}`} 
          icon={HiCurrencyRupee} 
          color="#10b981" 
          loading={dashboardLoading} 
          onClick={() => {
            setSearchQuery?.('');
            navigate('/orders', { 
              state: { 
                status: 'delivered', 
                storeId: storeIdToFetch || '', 
                startDate: dateRange?.startDate || '', 
                endDate: dateRange?.endDate || '' 
              } 
            });
          }} 
        />
        <StatsCard 
          title="AOV" 
          value={`₹${stats.aov || 0}`} 
          icon={HiArrowTrendingUp} 
          color="#3b82f6" 
          loading={dashboardLoading} 
          onClick={() => {
            setSearchQuery?.('');
            navigate('/orders', { 
              state: { 
                status: 'delivered', 
                storeId: storeIdToFetch || '', 
                startDate: dateRange?.startDate || '', 
                endDate: dateRange?.endDate || '' 
              } 
            });
          }} 
        />
        <StatsCard 
          title="Total Orders" 
          value={stats.orders || 0} 
          icon={HiShoppingBag} 
          color="#6366f1" 
          loading={dashboardLoading} 
          onClick={() => {
            setSearchQuery?.('');
            navigate('/orders', { 
              state: { 
                status: 'all', 
                storeId: storeIdToFetch || '', 
                startDate: dateRange?.startDate || '', 
                endDate: dateRange?.endDate || '' 
              } 
            });
          }} 
        />
        <StatsCard 
          title="Cancelled" 
          value={stats.cancelled_orders || 0} 
          icon={HiXCircle} 
          color="#ef4444" 
          loading={dashboardLoading} 
          onClick={() => {
            setSearchQuery?.('');
            navigate('/orders', { 
              state: { 
                status: 'cancelled', 
                storeId: storeIdToFetch || '', 
                startDate: dateRange?.startDate || '', 
                endDate: dateRange?.endDate || '' 
              } 
            });
          }} 
        />
        {isAdmin && (
          <>
            <StatsCard 
              title="Active Riders" 
              value={`${stats.active_riders || 0} / ${stats.total_riders || 0}`} 
              icon={HiTruck} 
              color="#f59e0b" 
              loading={dashboardLoading} 
              onClick={() => {
                setSearchQuery?.('');
                navigate('/riders', { 
                  state: { 
                    approvalStatus: 'approved', 
                    storeId: storeIdToFetch || '', 
                    startDate: dateRange?.startDate || '', 
                    endDate: dateRange?.endDate || '' 
                  } 
                });
              }} 
            />
            <StatsCard 
              title="Customers" 
              value={stats.customers || 0} 
              icon={HiUserGroup} 
              color="#8b5cf6" 
              loading={dashboardLoading} 
              onClick={() => {
                setSearchQuery?.('');
                navigate('/customers', { 
                  state: { 
                    storeId: storeIdToFetch || '', 
                    startDate: dateRange?.startDate || '', 
                    endDate: dateRange?.endDate || '' 
                  } 
                });
              }} 
            />
          </>
        )}
      </div>

      {/* Charts Section: Revenue Area Chart & Status Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>Revenue Trend</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily Gross Sales</span>
          </div>

          <div style={{ height: '220px', width: '100%', minWidth: 0, minHeight: '220px' }}>
            {chartLoading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Loading chart...
              </div>
            ) : (!revenueChartData || revenueChartData.length === 0) ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', gap: '8px' }}>
                <span>No revenue records in selected timeframe</span>
                {(dateRange.startDate || dateRange.endDate) && (
                  <button
                    onClick={() => setDateRange({ startDate: '', endDate: '' })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      background: 'white',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Reset to All Time
                  </button>
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <AreaChart data={revenueChartData} margin={{ top: 25, right: 15, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    tickFormatter={(str) => {
                      try {
                        const parts = str.split('-');
                        if (parts.length === 3) {
                          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                          return `${parts[2]} ${months[parseInt(parts[1], 10) - 1] || ''}`;
                        }
                        return str;
                      } catch {
                        return str;
                      }
                    }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`} 
                  />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', fontSize: '12px', color: '#fff' }} 
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Daily Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#revenueGrad)"
                    dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                  >
                    <LabelList 
                      dataKey="revenue" 
                      position="top" 
                      offset={8} 
                      formatter={(val) => Number(val) > 0 ? `₹${Number(val).toLocaleString()}` : ''}
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#059669' }}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Orders by Status Donut */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>Order Stages</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status mix</span>
          </div>

          <div style={{ height: '220px', width: '100%', minWidth: 0, minHeight: '220px' }}>
            {pieData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', gap: '8px' }}>
                <span>No orders status data</span>
                {(dateRange.startDate || dateRange.endDate) && (
                  <button
                    onClick={() => setDateRange({ startDate: '', endDate: '' })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      background: 'white',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Reset to All Time
                  </button>
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <PieChart margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderCustomizedPieLabel}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px', color: '#fff' }}
                    formatter={(val, name) => [`${val} orders (${totalStageOrders > 0 ? ((val / totalStageOrders) * 100).toFixed(0) : 0}%)`, name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={32} 
                    iconSize={8} 
                    wrapperStyle={{ fontSize: '10px' }}
                    formatter={(value, entry) => (
                      <span style={{ color: '#475569', fontSize: '10px', fontWeight: '500' }}>
                        {value}: <strong style={{ color: 'var(--text-main)' }}>{entry.payload.value}</strong>
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Live Orders & Low Stock Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '12px', marginBottom: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>Live Orders</h3>
            <button 
              onClick={() => {
                setSearchQuery?.('');
                navigate('/orders', { 
                  state: { 
                    storeId: storeIdToFetch || '', 
                    startDate: dateRange?.startDate || '', 
                    endDate: dateRange?.endDate || '' 
                  } 
                });
              }} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              View All <HiArrowUpRight size={12} />
            </button>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>S.No</th>
                  <th>Order #</th>
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
                  <tr 
                    key={order.id}
                    onClick={() => {
                      setSearchQuery?.('');
                      navigate('/orders', { 
                        state: { 
                          storeId: storeIdToFetch || '', 
                          orderId: order.id,
                          orderNumber: order.order_number
                        } 
                      });
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Click to view in Orders Command Center"
                  >
                    <td>{i + 1}</td>
                    <td><span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--primary)' }}>{order.order_number}</span></td>
                    <td>{order.customer?.full_name || 'Guest'}</td>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>Inventory Alerts</h3>
            <button 
              onClick={() => {
                setSearchQuery?.('');
                navigate('/inventory', { state: { activeTab: 'products', storeId: storeIdToFetch || '' } });
              }} 
              style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              Restock <HiArrowUpRight size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lowStock.length > 0 ? lowStock.map((prod, i) => (
              <div 
                key={i} 
                onClick={() => {
                  setSearchQuery?.('');
                  navigate('/inventory', { 
                    state: { 
                      activeTab: 'products', 
                      storeId: prod.store_id || prod.store?.id || storeIdToFetch || '',
                      productId: prod.id,
                      productName: prod.name
                    } 
                  });
                }}
                style={{ display: 'flex', gap: '8px', padding: '10px', background: '#fef2f2', borderRadius: '4px', borderLeft: '3px solid var(--danger)', cursor: 'pointer', transition: 'background 0.15s ease' }}
                title="Click to manage in Inventory"
              >
                <HiExclamationTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#991b1b', margin: 0 }}>{prod.name}</p>
                  <p style={{ fontSize: '11px', color: '#b91c1c', margin: '2px 0 0 0' }}>{prod.stock_quantity} {prod.weight_unit} left at {prod.store?.name}</p>
                </div>
              </div>
            )) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>All inventory levels healthy</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Stores & Top Products Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Top Stores */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>Store Performance</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click store to filter</span>
          </div>
          {storePerfLoading ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px' }}>Loading store performance...</p>
          ) : (!storePerfData || storePerfData.length === 0) ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '15px' }}>No active store data</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {storePerfData.map((st, i) => {
                const isSelected = globalStoreId === st.store_id;
                return (
                  <div 
                    key={st.store_id || i} 
                    onClick={() => setGlobalStoreId(isSelected ? '' : st.store_id)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '8px 10px', 
                      background: isSelected ? '#ecfdf5' : '#f8fafc', 
                      borderRadius: '6px', 
                      border: isSelected ? '1px solid #10b981' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={isSelected ? 'Click to deselect store' : 'Click to filter dashboard by this store'}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '12px', color: isSelected ? '#065f46' : 'inherit' }}>
                        {st.name} {isSelected && '✓'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{st.orders} fulfilled orders</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--primary)' }}>₹{Number(st.revenue).toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>revenue</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>Top Selling Products</h3>
            <button 
              onClick={() => {
                setSearchQuery?.('');
                navigate('/inventory', { state: { activeTab: 'products', storeId: storeIdToFetch || '' } });
              }} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              Catalog <HiArrowUpRight size={12} />
            </button>
          </div>
          {topProductsLoading ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px' }}>Loading best sellers...</p>
          ) : (!topProductsData || topProductsData.length === 0) ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '15px' }}>No product sales recorded in timeframe</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topProductsData.map((p, idx) => (
                <div 
                  key={p.product_id || idx} 
                  onClick={() => {
                    setSearchQuery?.('');
                    navigate('/inventory', { 
                      state: { 
                        activeTab: 'products', 
                        storeId: storeIdToFetch || '', 
                        productId: p.product_id,
                        productName: p.name
                      } 
                    });
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s ease' }}
                  title="Click to view in Inventory"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', width: '16px' }}>#{idx + 1}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '12px' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.units_sold} units sold</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-main)' }}>₹{Number(p.revenue).toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>sales</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
