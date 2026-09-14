import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setGlobalStoreId as setStoreAction,
  setSearchQuery as setSearchAction,
  setDateRange as setDateAction,
  setPreset as setPresetAction,
  clearFilters as clearAction,
  selectAllFilters
} from '../store/slices/filterSlice';

export const FilterProvider = ({ children }) => {
  return <>{children}</>;
};

export const useFilters = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectAllFilters);

  const setGlobalStoreId = useCallback((id) => {
    dispatch(setStoreAction(id));
  }, [dispatch]);

  const setSearchQuery = useCallback((query) => {
    dispatch(setSearchAction(query));
  }, [dispatch]);

  const setDateRange = useCallback((updater) => {
    dispatch(setDateAction(updater));
  }, [dispatch]);

  const setPreset = useCallback((val) => {
    dispatch(setPresetAction(val));
  }, [dispatch]);

  const clearFilters = useCallback(() => {
    dispatch(clearAction());
  }, [dispatch]);

  return {
    globalStoreId: filters.globalStoreId,
    setGlobalStoreId,
    searchQuery: filters.searchQuery,
    setSearchQuery,
    dateRange: filters.dateRange,
    setDateRange,
    preset: filters.preset,
    setPreset,
    clearFilters
  };
};
