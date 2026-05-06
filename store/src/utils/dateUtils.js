export const getDateRangeParams = (dateRange, customRange) => {
  const params = {};
  const now = new Date();
  
  if (dateRange === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    params.startDate = start.toISOString();
    
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    params.endDate = end.toISOString();
  } else if (dateRange === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    params.startDate = weekAgo.toISOString();
    
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    params.endDate = end.toISOString();
  } else if (dateRange === 'custom' && customRange) {
    if (customRange.start) {
      const start = new Date(customRange.start);
      start.setHours(0, 0, 0, 0);
      params.startDate = start.toISOString();
    }
    if (customRange.end) {
      const end = new Date(customRange.end);
      end.setHours(23, 59, 59, 999);
      params.endDate = end.toISOString();
    }
  }
  
  return params;
};
