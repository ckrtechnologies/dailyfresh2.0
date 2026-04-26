import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Pages & Components
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Notifications from './pages/Notifications.jsx';
import Orders from './pages/Orders.jsx';
import Stores from './pages/Stores.jsx';
import Riders from './pages/Riders.jsx';
import Customers from './pages/Customers.jsx';
import Inventory from './pages/Inventory.jsx';
import HomeManagement from './pages/HomeManagement.jsx';
import Settings from './pages/Settings.jsx';
import MainLayout from './components/layout/MainLayout.jsx';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0a0f18' }}>
      <p style={{ color: '#1b8b3b', fontWeight: 'bold' }}>Loading Dashboard...</p>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Layout Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Core Management Modules */}
        <Route path="orders" element={<Orders />} />
        <Route path="stores" element={<ProtectedRoute roles={['admin']}><Stores /></ProtectedRoute>} />
        <Route path="riders" element={<ProtectedRoute roles={['admin']}><Riders /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute roles={['admin']}><Customers /></ProtectedRoute>} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="home-manager" element={<ProtectedRoute roles={['admin']}><HomeManagement /></ProtectedRoute>} />
        <Route path="settings" element={<Settings />} />
        
        {/* Specialized Modules */}
        <Route path="notifications" element={
          <ProtectedRoute roles={['admin']}>
            <Notifications />
          </ProtectedRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
