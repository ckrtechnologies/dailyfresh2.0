import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [globalStoreId, setGlobalStoreId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '', // YYYY-MM-DD
    endDate: ''
  });

  const clearFilters = () => {
    setGlobalStoreId('');
    setSearchQuery('');
    setDateRange({ startDate: '', endDate: '' });
  };

  return (
    <FilterContext.Provider value={{
      globalStoreId,
      setGlobalStoreId,
      searchQuery,
      setSearchQuery,
      dateRange,
      setDateRange,
      clearFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
