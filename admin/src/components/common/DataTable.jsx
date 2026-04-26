import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  FileText, 
  Search, 
  ArrowUpDown,
  Filter,
  Settings2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Standard DataTable following [user_global] rules.
 * Features: S.No, Server-side Pagination, CSV/PDF Export, Global Search UI.
 */
const DataTable = ({ 
  columns, 
  data = [], 
  pagination, 
  onPageChange, 
  onPageSizeChange,
  loading = false,
  emptyMessage = "No records found",
  searchPlaceholder = "Search...",
  title
}) => {
  const { total = 0, page = 1, pageSize = 50 } = pagination || {};

  // Export CSV
  const exportCSV = () => {
    const headers = columns.map(c => c.header).join(',');
    const rows = data.map(row => 
      columns.map(c => {
        const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
        return `"${val || ''}"`;
      }).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'export'}_${new Date().getTime()}.csv`;
    a.click();
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(title || 'Data Export', 14, 15);
    
    const tableHeaders = [columns.map(c => c.header)];
    const tableData = data.map(row => 
      columns.map(c => typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor])
    );

    doc.autoTable({
      head: tableHeaders,
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    doc.save(`${title || 'export'}_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ background: 'white', overflow: 'hidden' }}>
      {/* Search & Export Toolbar */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid var(--border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            style={{ 
              width: '100%', 
              padding: '6px 10px 6px 32px', 
              fontSize: '13px', 
              border: '1px solid var(--border)', 
              borderRadius: '4px',
              outline: 'none'
            }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportCSV} className="btn-compact" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer' }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={exportPDF} className="btn-compact" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer' }}>
            <FileText size={14} /> PDF
          </button>
          <button className="btn-compact" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer' }}>
            <Settings2 size={14} /> Columns
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '70px', textAlign: 'center' }}>S.No</th>
              {columns.map((col, idx) => (
                <th key={idx} style={{ textAlign: col.align || 'left', width: col.width || 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: col.align === 'center' ? 'center' : (col.align === 'right' ? 'flex-end' : 'flex-start') }}>
                    {col.header}
                    {col.sortable !== false && <ArrowUpDown size={12} style={{ color: '#cbd5e1' }} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={columns.length + 1}>
                    <div style={{ height: '20px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  </td>
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {/* S.No Calculation: (page - 1) * pageSize + index + 1 */}
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: '500' }}>
                    {(page - 1) * pageSize + rowIndex + 1}
                  </td>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row) : (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ 
        padding: '12px 16px', 
        borderTop: '1px solid var(--border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: '#f8fafc',
        fontSize: '13px'
      }}>
        <div>
          Showing <b>{Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)}</b> of <b>{total}</b> records
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Rows per page:</span>
            <select 
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{ padding: '4px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '12px' }}
            >
              {[50, 100, 200, 500].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button 
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              style={{ padding: '6px', border: '1px solid var(--border)', background: 'white', borderRadius: '4px', display: 'flex', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} color={page === 1 ? '#cbd5e1' : '#64748b'} />
            </button>
            <div style={{ padding: '0 12px' }}>Page <b>{page}</b></div>
            <button 
              disabled={page * pageSize >= total}
              onClick={() => onPageChange(page + 1)}
              style={{ padding: '6px', border: '1px solid var(--border)', background: 'white', borderRadius: '4px', display: 'flex', cursor: page * pageSize >= total ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={16} color={page * pageSize >= total ? '#cbd5e1' : '#64748b'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
