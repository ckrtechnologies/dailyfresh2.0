import React from 'react';
import { X, Printer, Download, ShieldCheck, Building2, Phone, Mail, FileText } from 'lucide-react';

const InvoiceModal = ({ order, onClose }) => {
  if (!order) return null;

  const orderNumber = order.order_number || order.orderNumber || 'N/A';
  const invoiceNumber = `INV-${orderNumber}`;
  const createdAt = order.created_at || order.createdAt;
  const orderDate = createdAt ? new Date(createdAt) : new Date();
  
  const formattedDate = !isNaN(orderDate.getTime()) 
    ? orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';
  const formattedTime = !isNaN(orderDate.getTime()) 
    ? orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : 'N/A';

  const customer = order.customer || order.user || {};
  const customerName = customer.full_name || customer.fullName || order.address?.fullName || order.shipping_address?.full_name || 'Valued Customer';
  const customerPhone = customer.phone || order.address?.phone || order.shipping_address?.phone || 'N/A';
  const customerEmail = customer.email || 'N/A';
  
  const addr = order.address || order.delivery_address || order.shipping_address;
  const addressLine = addr 
    ? `${addr.line1 || addr.address || ''}${addr.line2 ? `, ${addr.line2}` : ''}, ${addr.city || ''} - ${addr.pincode || ''}`
    : (order.address_line1 || 'Address on record');

  const store = order.store || {};
  const storeName = store.name || 'Daily Fresh Hub';
  const storeAddress = store.address || 'Kolkata, West Bengal';

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.total_items_price || order.totalItemsPrice || order.subtotal || 0);
  const deliveryCharge = Number(order.delivery_charge || order.deliveryCharge || 0);
  const gstAmount = Number(order.gst_amount || order.gstAmount || 0);
  const discountAmount = Number(order.discount_amount || order.discountAmount || 0);
  const grandTotal = Number(order.total_amount || order.totalAmount || 0);

  const cgst = (gstAmount / 2).toFixed(2);
  const sgst = (gstAmount / 2).toFixed(2);

  const handlePrint = () => {
    const printContent = document.getElementById('printable-tax-invoice');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${invoiceNumber}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #cbd5e1; padding: 24px; border-radius: 8px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 16px; }
            .company-title { font-size: 24px; font-weight: 800; color: #047857; letter-spacing: -0.5px; }
            .company-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
            .invoice-tag { font-size: 20px; font-weight: 800; color: #0f172a; text-align: right; text-transform: uppercase; }
            .meta-table { width: 100%; margin-bottom: 24px; border-collapse: collapse; }
            .meta-table td { vertical-align: top; width: 50%; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
            .meta-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
            .item-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .item-table th { background: #f1f5f9; color: #334155; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 10px; border: 1px solid #cbd5e1; text-align: left; }
            .item-table td { padding: 10px; border: 1px solid #e2e8f0; font-size: 12px; }
            .totals-table { width: 45%; margin-left: auto; border-collapse: collapse; margin-bottom: 24px; }
            .totals-table td { padding: 6px 12px; border: 1px solid #e2e8f0; font-size: 12px; }
            .totals-table .grand-total { background: #f0fdf4; font-weight: 800; font-size: 14px; color: #166534; border-top: 2px solid #15803d; }
            .footer-notes { margin-top: 30px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b; }
            .legal-badge { display: inline-block; padding: 2px 8px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: 600; font-size: 10px; }
            @media print {
              body { padding: 0; }
              .invoice-box { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '92vh',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden'
      }}>
        {/* Header Bar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#047857" />
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
              Official Tax Invoice / Dispute Document
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#047857',
                color: 'white',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Printer size={16} /> Print / Save PDF
            </button>
            <button 
              onClick={onClose}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Printable View */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: '#f1f5f9' }}>
          <div id="printable-tax-invoice" style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            {/* Invoice Top Header */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', borderBottom: '2px solid #0f172a', paddingBottom: '16px' }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'top' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#047857', letterSpacing: '-0.5px' }}>
                      DAILY FRESH
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                      DAILY FRESH FOODS & SEAFOODS PRIVATE LIMITED
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      CIN: U15100WB2024PTC268492 • GSTIN: 19AAECD1234M1Z5
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      FSSAI Lic. No: 12824019000182 • Support: support@dailyfreshkolkata.online
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>
                      TAX INVOICE
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginTop: '4px' }}>
                      Invoice #: <span style={{ color: '#047857' }}>{invoiceNumber}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Order Ref: #{orderNumber}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Date: {formattedDate} • Time: {formattedTime}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Billed To & Shipped From */}
            <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'separate', borderSpacing: '12px 0' }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'top', width: '50%', padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                      Billed & Delivered To (Customer)
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{customerName}</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>Phone: {customerPhone}</div>
                    {customerEmail !== 'N/A' && <div style={{ fontSize: '12px', color: '#475569' }}>Email: {customerEmail}</div>}
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>
                      <b>Address:</b> {addressLine}
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top', width: '50%', padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                      Dispatched From (Fulfillment Hub)
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{storeName}</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{storeAddress}</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                      <b>Delivery Type:</b> {order.delivery_type === 'express' ? '⚡ 90-Min Express Delivery' : '📅 Scheduled Slot Delivery'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      <b>Payment Mode:</b> {String(order.payment_method || 'COD').toUpperCase()} ({String(order.payment_status || 'unpaid').toUpperCase()})
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Itemized Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 12px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: '700', color: '#334155', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: '700', color: '#334155', textAlign: 'left' }}>Item Description</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: '700', color: '#334155', textAlign: 'center' }}>HSN</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: '700', color: '#334155', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: '700', color: '#334155', textAlign: 'right' }}>Rate (₹)</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: '700', color: '#334155', textAlign: 'right' }}>Taxable Amt (₹)</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: '700', color: '#334155', textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
                      No items recorded on this order
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const rate = Number(item.unit_price || item.unitPrice || (item.total_price / (item.quantity || 1)) || 0).toFixed(2);
                    const total = Number(item.total_price || item.totalPrice || 0).toFixed(2);
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {item.product?.name || item.name || 'Product'}
                          </div>
                          {(item.variant?.name || item.preferences?.cut) && (
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Specification: {item.variant?.name || item.preferences?.cut}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'center', color: '#64748b' }}>0302</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'right' }}>₹{rate}</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'right' }}>₹{total}</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'right', fontWeight: '700' }}>₹{total}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Financial Summary Calculation */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <table style={{ width: '380px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>Items Total (Taxable)</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'right', fontWeight: '600' }}>₹{subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>Delivery / Handling Charge</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'right', fontWeight: '600' }}>₹{deliveryCharge.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>CGST (6%)</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'right', color: '#475569' }}>₹{cgst}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>SGST (6%)</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'right', color: '#475569' }}>₹{sgst}</td>
                  </tr>
                  {discountAmount > 0 && (
                    <tr>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#047857' }}>Promotional Discount</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'right', fontWeight: '600', color: '#047857' }}>-₹{discountAmount.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{ background: '#f0fdf4' }}>
                    <td style={{ padding: '8px 12px', border: '1px solid #bbf7d0', fontSize: '13px', fontWeight: '800', color: '#166534' }}>
                      Grand Total (INR)
                    </td>
                    <td style={{ padding: '8px 12px', border: '1px solid #bbf7d0', fontSize: '14px', textAlign: 'right', fontWeight: '800', color: '#166534' }}>
                      ₹{grandTotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legal Dispute & Finance Declaration */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', fontSize: '11px', color: '#64748b', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: '700', color: '#334155' }}>
                <ShieldCheck size={14} color="#047857" />
                Declaration & Terms for Financial Records and Dispute Resolution:
              </div>
              <div>
                1. This Tax Invoice represents a confirmed legal transaction between Daily Fresh Foods & Seafoods Pvt Ltd and the customer named above.
              </div>
              <div>
                2. In case of any dispute regarding delivery quality, temperature compliance, weight variation, or payment deduction, this document along with order reference <b>#{orderNumber}</b> must be presented within 24 hours to <b>disputes@dailyfreshkolkata.online</b>.
              </div>
              <div>
                3. This is a computer-generated tax invoice generated under Rule 48 of CGST Rules, 2017 and does not require a physical signature.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
