import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { FilterProvider } from '../../context/FilterContext.jsx';
import '../../styles/layout.css';

const MainLayout = () => {
  return (
    <FilterProvider>
      <div className="main-layout">
        <Sidebar />
        <div className="content-wrapper">
          <Header />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </FilterProvider>
  );
};

export default MainLayout;
