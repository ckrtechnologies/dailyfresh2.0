/**
 * Utility to convert JSON objects to CSV and trigger browser download
 * @param {Array<Object>} data Array of objects to export
 * @param {string} filename Output filename without extension
 * @param {Array<{ key: string, label: string }>} columns Optional column definitions
 */
export const exportToCsv = (data, filename = 'export', columns = null) => {
  if (!data || !data.length) {
    alert('No data available to export');
    return;
  }

  // Determine headers
  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
  const headers = cols.map(c => `"${String(c.label).replace(/"/g, '""')}"`).join(',');

  // Build rows
  const rows = data.map(item => {
    return cols.map(c => {
      let val = item[c.key];
      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      } else {
        val = String(val);
      }
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
