import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  PlusCircle, 
  Bell, 
  LogOut,
  Settings,
  Truck,
  Ticket
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/layout.css';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'store_manager'] },
    { name: 'Orders', path: '/orders', icon: ShoppingBag, roles: ['admin', 'store_manager'] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['store_manager', 'admin'] },
    { name: 'Home Manager', path: '/home-manager', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Stores', path: '/stores', icon: PlusCircle, roles: ['admin'] },
    { name: 'Riders', path: '/riders', icon: Truck, roles: ['admin'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['admin'] },
    { name: 'Notifications', path: '/notifications', icon: Bell, roles: ['admin'] },
    { name: 'Coupons', path: '/coupons', icon: Ticket, roles: ['admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'store_manager'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">DF</div>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>Daily Fresh</h2>
      </div>

      <nav className="sidebar-nav">
        {filteredNav.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={16} /> {/* Reduced size */}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
