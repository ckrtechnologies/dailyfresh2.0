import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiSquares2X2, 
  HiShoppingBag, 
  HiCube, 
  HiViewColumns, 
  HiBuildingStorefront, 
  HiTruck, 
  HiMap, 
  HiClock, 
  HiUserGroup, 
  HiBell, 
  HiTicket, 
  HiCog6Tooth,
  HiArrowLeftOnRectangle
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import '../../styles/layout.css';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: HiSquares2X2, 
      color: '#10b981', 
      bg: '#ecfdf5', 
      roles: ['admin', 'store_manager'] 
    },
    { 
      name: 'Orders', 
      path: '/orders', 
      icon: HiShoppingBag, 
      color: '#3b82f6', 
      bg: '#eff6ff', 
      roles: ['admin', 'store_manager'] 
    },
    { 
      name: 'Inventory', 
      path: '/inventory', 
      icon: HiCube, 
      color: '#f59e0b', 
      bg: '#fffbeb', 
      roles: ['store_manager', 'admin'] 
    },
    { 
      name: 'Home Manager', 
      path: '/home-manager', 
      icon: HiViewColumns, 
      color: '#6366f1', 
      bg: '#eef2ff', 
      roles: ['admin'] 
    },
    { 
      name: 'Stores', 
      path: '/stores', 
      icon: HiBuildingStorefront, 
      color: '#0d9488', 
      bg: '#f0fdfa', 
      roles: ['admin'] 
    },
    { 
      name: 'Riders', 
      path: '/riders', 
      icon: HiTruck, 
      color: '#0284c7', 
      bg: '#f0f9ff', 
      roles: ['admin'] 
    },
    { 
      name: 'Rider Logs', 
      path: '/rider-logs', 
      icon: HiMap, 
      color: '#8b5cf6', 
      bg: '#f5f3ff', 
      roles: ['admin'] 
    },
    { 
      name: 'Delivery Slots', 
      path: '/delivery-slots', 
      icon: HiClock, 
      color: '#f43f5e', 
      bg: '#fff1f2', 
      roles: ['admin'] 
    },
    { 
      name: 'Customers', 
      path: '/customers', 
      icon: HiUserGroup, 
      color: '#9333ea', 
      bg: '#faf5ff', 
      roles: ['admin'] 
    },
    { 
      name: 'Notifications', 
      path: '/notifications', 
      icon: HiBell, 
      color: '#eab308', 
      bg: '#fefce8', 
      roles: ['admin'] 
    },
    { 
      name: 'Coupons', 
      path: '/coupons', 
      icon: HiTicket, 
      color: '#ec4899', 
      bg: '#fdf2f8', 
      roles: ['admin'] 
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: HiCog6Tooth, 
      color: '#64748b', 
      bg: '#f8fafc', 
      roles: ['admin', 'store_manager'] 
    },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img 
          src="/logo.png" 
          alt="Daily Fresh" 
          style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'contain', background: '#f8fafc', padding: '2px', border: '1px solid var(--border)' }} 
        />
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '-0.2px' }}>Daily Fresh</h2>
      </div>

      <nav className="sidebar-nav">
        {filteredNav.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 10px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: isActive ? '600' : '500',
              color: isActive ? item.color : 'var(--text-main)',
              background: isActive ? item.bg : 'transparent',
              transition: 'all 0.15s ease'
            })}
          >
            {({ isActive }) => (
              <>
                <div 
                  className="nav-icon-badge"
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? item.color : item.bg,
                    color: isActive ? '#ffffff' : item.color,
                    boxShadow: isActive ? `0 2px 6px -1px ${item.color}66` : 'none',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <item.icon size={15} />
                </div>
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          onClick={logout} 
          className="nav-item" 
          style={{ 
            width: '100%', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 10px',
            borderRadius: '6px',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          <div 
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fef2f2',
              color: '#ef4444',
              flexShrink: 0
            }}
          >
            <HiArrowLeftOnRectangle size={15} />
          </div>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
