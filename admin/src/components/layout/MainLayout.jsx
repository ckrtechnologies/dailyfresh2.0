import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { FilterProvider, useFilters } from '../../context/FilterContext.jsx';
import '../../styles/layout.css';

const MainLayoutContent = () => {
  const filters = useFilters();
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="content-wrapper">
        <Header />
        <main className="main-content">
          <Outlet context={filters} />
        </main>
      </div>
    </div>
  );
};

const MainLayout = () => {
  return (
    <FilterProvider>
      <MainLayoutContent />
    </FilterProvider>
  );
};

export default MainLayout;

